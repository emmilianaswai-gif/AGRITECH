package com.example.foodach.Config;

import com.example.foodach.Entity.Store;
import com.example.foodach.Repository.StoreRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
@Order(1)
@RequiredArgsConstructor
public class TenantFilter implements Filter {

    private static final String USER_HEADER = "X-User-Id";
    private static final String STORE_HEADER = "X-Store-Id";

    private final StoreRepository storeRepository;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String userId = httpRequest.getHeader(USER_HEADER);
        if (userId != null && !userId.isBlank()) {
            TenantContext.set(userId.trim());
        }

        String storeHeader = httpRequest.getHeader(STORE_HEADER);
        if (storeHeader != null && !storeHeader.isBlank()) {
            Long storeId = null;
            try {
                storeId = Long.parseLong(storeHeader.trim());
            } catch (NumberFormatException ignored) {
                storeId = null;
            }
            if (storeId != null) {
                String currentUserId = TenantContext.get();
                if (currentUserId == null || currentUserId.isBlank()) {
                    TenantContext.setStoreId(null);
                } else {
                    Optional<Store> store = storeRepository.findById(storeId);
                    boolean owned = store.isPresent()
                            && currentUserId.equals(store.get().getOwnerId());
                    TenantContext.setStoreId(owned ? storeId : null);
                }
            }
        }

        try {
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}