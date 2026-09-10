package com.example.foodach.Service;

import com.example.foodach.DTO.SaleItemRequestDTO;
import com.example.foodach.DTO.SaleItemResponseDTO;

import java.util.List;

public interface SaleItemService {
    SaleItemResponseDTO addItem(SaleItemRequestDTO requestDTO);
    List<SaleItemResponseDTO> getAllItems();
    SaleItemResponseDTO getItemById(Long id);
    void deleteItem(Long id);
}