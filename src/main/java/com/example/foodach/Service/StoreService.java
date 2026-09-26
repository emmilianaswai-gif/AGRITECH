package com.example.foodach.Service;

import com.example.foodach.DTO.StoreRequestDTO;
import com.example.foodach.DTO.StoreResponseDTO;

import java.util.List;

public interface StoreService {
    StoreResponseDTO addStore(StoreRequestDTO requestDTO);
    List<StoreResponseDTO> getMyStores();
    List<StoreResponseDTO> getAllStores(String country, String region);
    StoreResponseDTO getStoreById(Long id);
    void deleteStore(Long id);
}