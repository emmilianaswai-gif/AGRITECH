package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.InventoryItemRequestDTO;
import com.example.foodach.DTO.InventoryItemResponseDTO;
import com.example.foodach.Entity.InventoryItem;
import com.example.foodach.Repository.InventoryItemRepository;
import com.example.foodach.Service.InventoryItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryItemServiceImpl implements InventoryItemService {

    private final InventoryItemRepository repository;

    @Override
    public InventoryItemResponseDTO addItem(InventoryItemRequestDTO requestDTO) {
        if (requestDTO.title() == null || requestDTO.title().isBlank()) {
            throw new IllegalArgumentException("Product title is required");
        }
        if (requestDTO.sellingPrice() == null || requestDTO.sellingPrice() <= 0) {
            throw new IllegalArgumentException("Selling price must be greater than zero");
        }

        InventoryItem item = new InventoryItem();
        item.setTitle(requestDTO.title());
        item.setCategory(requestDTO.category());
        item.setSupplier(requestDTO.supplier());
        item.setOwnProduce(Boolean.TRUE.equals(requestDTO.ownProduce()));
        item.setCostPrice(requestDTO.costPrice() == null ? 0.0 : requestDTO.costPrice());
        item.setSellingPrice(requestDTO.sellingPrice());
        item.setQuantity(requestDTO.quantity() == null ? 0.0 : requestDTO.quantity());
        item.setUnit(requestDTO.unit());
        item.setCreatedAt(Instant.now());

        return mapToResponseDTO(repository.save(item));
    }

    @Override
    public List<InventoryItemResponseDTO> getAllItems() {
        return repository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public InventoryItemResponseDTO getItemById(Long id) {
        return repository.findById(id)
                .map(this::mapToResponseDTO)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));
    }

    @Override
    public void deleteItem(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Inventory item not found");
        }
        repository.deleteById(id);
    }

    private InventoryItemResponseDTO mapToResponseDTO(InventoryItem item) {
        return new InventoryItemResponseDTO(
                item.getId(),
                item.getTitle(),
                item.getCategory(),
                item.getSupplier(),
                item.getOwnProduce(),
                item.getCostPrice(),
                item.getSellingPrice(),
                item.getQuantity(),
                item.getUnit(),
                item.getCreatedAt()
        );
    }
}