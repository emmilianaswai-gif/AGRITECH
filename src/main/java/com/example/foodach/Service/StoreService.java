package com.example.foodach.Service;

import com.example.foodach.DTO.StoreRequestDTO;
import com.example.foodach.DTO.StoreResponseDTO;

import java.util.List;

public interface StoreService {
    StoreResponseDTO addStore(StoreRequestDTO requestDTO);
    List<StoreResponseDTO> getAllStores();
    StoreResponseDTO getStoreById(Long id);
    void deleteStore(Long id);
}