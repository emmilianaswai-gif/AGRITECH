package com.example.foodach.ServiceImpl;

import com.example.foodach.Config.TenantContext;
import com.example.foodach.DTO.SaleItemRequestDTO;
import com.example.foodach.DTO.SaleItemResponseDTO;
import com.example.foodach.Entity.SaleItem;
import com.example.foodach.Repository.SaleItemRepository;
import com.example.foodach.Service.SaleItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaleItemServiceImpl implements SaleItemService {

    private final SaleItemRepository repository;

    @Override
    public SaleItemResponseDTO addItem(SaleItemRequestDTO requestDTO) {
        if (requestDTO.title() == null || requestDTO.title().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }

        String ownerId = TenantContext.get();
        if (ownerId == null || ownerId.isBlank()) {
            throw new RuntimeException("User identity is required");
        }

        SaleItem item = new SaleItem();
        item.setTitle(requestDTO.title());
        item.setCategory(requestDTO.category());
        item.setDescription(requestDTO.description());
        item.setQuantity(requestDTO.quantity());
        item.setUnit(requestDTO.unit());
        item.setUnitPrice(requestDTO.unitPrice());
        item.setMarketPrice(requestDTO.marketPrice());
        item.setFeePercent(requestDTO.feePercent() == null ? 5.0 : requestDTO.feePercent());
        item.setStatus(requestDTO.status() == null ? "Available" : requestDTO.status());
        item.setCreatedAt(Instant.now());
        item.setOwnerUserId(ownerId);

        return mapToResponseDTO(repository.save(item));
    }

    @Override
    public List<SaleItemResponseDTO> getAllItems() {
        String ownerId = TenantContext.get();
        if (ownerId == null || ownerId.isBlank()) {
            throw new RuntimeException("User identity is required");
        }
        return repository.findByOwnerUserId(ownerId).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public SaleItemResponseDTO getItemById(Long id) {
        SaleItem item = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sale item not found"));
        String ownerId = TenantContext.get();
        if (ownerId != null && !ownerId.isBlank() && !ownerId.equals(item.getOwnerUserId())) {
            throw new RuntimeException("Sale item not found");
        }
        return mapToResponseDTO(item);
    }

    @Override
    public void deleteItem(Long id) {
        SaleItem item = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sale item not found"));
        String ownerId = TenantContext.get();
        if (ownerId != null && !ownerId.isBlank() && !ownerId.equals(item.getOwnerUserId())) {
            throw new RuntimeException("Sale item not found");
        }
        repository.deleteById(id);
    }

    private SaleItemResponseDTO mapToResponseDTO(SaleItem item) {
        return new SaleItemResponseDTO(
                item.getId(),
                item.getTitle(),
                item.getCategory(),
                item.getDescription(),
                item.getQuantity(),
                item.getUnit(),
                item.getUnitPrice(),
                item.getMarketPrice(),
                item.getFeePercent(),
                item.getStatus(),
                item.getCreatedAt()
        );
    }
}
