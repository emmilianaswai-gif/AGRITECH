package com.example.foodach.Service;

import com.example.foodach.DTO.BuyItemRequestDTO;
import com.example.foodach.DTO.BuyItemResponseDTO;

import java.util.List;

public interface BuyItemService {
    BuyItemResponseDTO addItem(BuyItemRequestDTO requestDTO);
    List<BuyItemResponseDTO> getAllItems();
    BuyItemResponseDTO getItemById(Long id);
    void deleteItem(Long id);
}