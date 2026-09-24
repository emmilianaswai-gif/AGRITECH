package com.example.foodach.ServiceImpl;

import com.example.foodach.Config.TenantContext;
import com.example.foodach.DTO.BuyItemRequestDTO;
import com.example.foodach.DTO.BuyItemResponseDTO;
import com.example.foodach.Entity.BuyItem;
import com.example.foodach.Repository.BuyItemRepository;
import com.example.foodach.Service.BuyItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BuyItemServiceImpl implements BuyItemService {

    private final BuyItemRepository repository;

    @Override
    public BuyItemResponseDTO addItem(BuyItemRequestDTO requestDTO) {
        if (requestDTO.title() == null || requestDTO.title().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }

        String ownerId = TenantContext.get();
        if (ownerId == null || ownerId.isBlank()) {
            throw new RuntimeException("User identity is required");
        }

        BuyItem item = new BuyItem();
        item.setTitle(requestDTO.title());
        item.setCategory(requestDTO.category());
        item.setDescription(requestDTO.description());
        item.setQuantity(requestDTO.quantity());
        item.setUnit(requestDTO.unit());
        item.setUnitPrice(requestDTO.unitPrice());
        item.setSupplier(requestDTO.supplier());
        item.setStatus(requestDTO.status() == null ? "Open" : requestDTO.status());
        item.setCreatedAt(Instant.now());
        item.setOwnerUserId(ownerId);
        item.setStoreId(TenantContext.getStoreId());

        return mapToResponseDTO(repository.save(item));
    }

    @Override
    public List<BuyItemResponseDTO> getAllItems() {
        String ownerId = requireOwnerId();
        List<BuyItem> items = scopedItems(ownerId);
        return items.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    private List<BuyItem> scopedItems(String ownerId) {
        Long storeId = TenantContext.getStoreId();
        if (storeId != null) {
            List<BuyItem> byStore = repository.findByStoreId(storeId);
            List<BuyItem> byOwner = repository.findByOwnerUserId(ownerId);
            byStore.addAll(byOwner.stream()
                    .filter(item -> item.getStoreId() == null)
                    .toList());
            return byStore;
        }
        return repository.findByOwnerUserId(ownerId);
    }

    private boolean hasAccess(BuyItem item) {
        String ownerId = TenantContext.get();
        if (ownerId == null || !ownerId.equals(item.getOwnerUserId())) {
            return false;
        }
        Long storeId = TenantContext.getStoreId();
        if (storeId != null && item.getStoreId() != null) {
            return storeId.equals(item.getStoreId());
        }
        return true;
    }

    @Override
    public BuyItemResponseDTO getItemById(Long id) {
        BuyItem item = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Buy item not found"));
        if (!hasAccess(item)) {
            throw new RuntimeException("Buy item not found");
        }
        return mapToResponseDTO(item);
    }

    @Override
    public void deleteItem(Long id) {
        BuyItem item = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Buy item not found"));
        if (!hasAccess(item)) {
            throw new RuntimeException("Buy item not found");
        }
        repository.deleteById(id);
    }

    private String requireOwnerId() {
        String ownerId = TenantContext.get();
        if (ownerId == null || ownerId.isBlank()) {
            throw new RuntimeException("User identity is required");
        }
        return ownerId;
    }

    private BuyItemResponseDTO mapToResponseDTO(BuyItem item) {
        return new BuyItemResponseDTO(
                item.getId(),
                item.getTitle(),
                item.getCategory(),
                item.getDescription(),
                item.getQuantity(),
                item.getUnit(),
                item.getUnitPrice(),
                item.getSupplier(),
                item.getStatus(),
                item.getCreatedAt()
        );
    }
}
