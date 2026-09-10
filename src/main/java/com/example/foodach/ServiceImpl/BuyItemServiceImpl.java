package com.example.foodach.ServiceImpl;

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

        return mapToResponseDTO(repository.save(item));
    }

    @Override
    public List<BuyItemResponseDTO> getAllItems() {
        return repository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public BuyItemResponseDTO getItemById(Long id) {
        return repository.findById(id)
                .map(this::mapToResponseDTO)
                .orElseThrow(() -> new RuntimeException("Buy item not found"));
    }

    @Override
    public void deleteItem(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Buy item not found");
        }
        repository.deleteById(id);
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