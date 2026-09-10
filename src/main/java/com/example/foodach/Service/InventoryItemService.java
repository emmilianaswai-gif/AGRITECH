package com.example.foodach.Service;

import com.example.foodach.DTO.InventoryItemRequestDTO;
import com.example.foodach.DTO.InventoryItemResponseDTO;

import java.util.List;

public interface InventoryItemService {
    InventoryItemResponseDTO addItem(InventoryItemRequestDTO requestDTO);
    List<InventoryItemResponseDTO> getAllItems();
    InventoryItemResponseDTO getItemById(Long id);
    void deleteItem(Long id);
}