package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.TechnicalSupportRequest;
import com.example.foodach.DTO.TechnicalSupportResponse;
import com.example.foodach.Entity.TechnicalSupport;
import com.example.foodach.Repository.TechnicalSupportRepository;
import com.example.foodach.Service.TechnicalSupportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TechnicalSupportServiceImpl implements TechnicalSupportService {

    private static final Set<String> PROVIDER_ROLES = Set.of("FAMER", "ADMIN", "SUPER_ADMIN");

    private final TechnicalSupportRepository repository;

    private boolean canProvide(String role) {
        return role != null && PROVIDER_ROLES.contains(role.trim().toUpperCase(Locale.ROOT));
    }

    private boolean isAdmin(String role) {
        return role != null && Set.of("ADMIN", "SUPER_ADMIN").contains(role.trim().toUpperCase(Locale.ROOT));
    }

    @Override
    public List<TechnicalSupportResponse> getAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    private void validate(TechnicalSupportRequest request) {
        if (request.name() == null || request.name().isBlank())
            throw new IllegalArgumentException("Name is required");
        if (request.phone() == null || request.phone().isBlank())
            throw new IllegalArgumentException("Phone number is required");
        if (request.email() == null || request.email().isBlank())
            throw new IllegalArgumentException("Email is required");
        if (request.category() == null || request.category().isBlank())
            throw new IllegalArgumentException("Category is required");
    }

    @Override
    public TechnicalSupportResponse add(TechnicalSupportRequest request) {
        if (!canProvide(request.role()))
            throw new RuntimeException("Only farmers and admins can register support contacts");
        validate(request);

        TechnicalSupport support = new TechnicalSupport();
        support.setName(request.name().trim());
        support.setContact(request.contact());
        support.setPhone(request.phone().trim());
        support.setEmail(request.email().trim());
        support.setCategory(request.category().trim());
        support.setDescription(request.description());
        support.setRole(request.role());
        support.setUserId(request.userId());
        support.setCreatedAt(Instant.now());
        support.setUpdatedAt(Instant.now());

        return mapToResponseDTO(repository.save(support));
    }

    @Override
    public TechnicalSupportResponse update(Long id, TechnicalSupportRequest request) {
        TechnicalSupport support = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Support contact not found"));

        if (!canProvide(request.role()))
            throw new RuntimeException("Only farmers and admins can update support contacts");
        boolean owner = request.userId() != null && request.userId().equals(support.getUserId());
        if (!owner && !isAdmin(request.role()))
            throw new RuntimeException("You can only edit your own support contact");

        validate(request);

        support.setName(request.name().trim());
        support.setContact(request.contact());
        support.setPhone(request.phone().trim());
        support.setEmail(request.email().trim());
        support.setCategory(request.category().trim());
        support.setDescription(request.description());
        support.setUpdatedAt(Instant.now());

        return mapToResponseDTO(repository.save(support));
    }

    @Override
    public void delete(Long id, String role, String userId) {
        TechnicalSupport support = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Support contact not found"));

        if (!canProvide(role))
            throw new RuntimeException("Only farmers and admins can remove support contacts");
        boolean owner = userId != null && userId.equals(support.getUserId());
        if (!owner && !isAdmin(role))
            throw new RuntimeException("You can only delete your own support contact");

        repository.delete(support);
    }

    private TechnicalSupportResponse mapToResponseDTO(TechnicalSupport support) {
        return new TechnicalSupportResponse(
                support.getId(),
                support.getName(),
                support.getContact(),
                support.getPhone(),
                support.getEmail(),
                support.getCategory(),
                support.getDescription(),
                support.getRole(),
                support.getUserId(),
                support.getCreatedAt(),
                support.getUpdatedAt()
        );
    }
}