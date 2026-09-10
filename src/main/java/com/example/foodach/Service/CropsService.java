package com.example.foodach.Service;

import com.example.foodach.DTO.CropRequestDTO;
import com.example.foodach.DTO.CropResponseDTO;

import java.util.List;

public interface CropsService {
    CropResponseDTO addCrop(CropRequestDTO requestDTO);
    CropResponseDTO getCropById(Long id);
    List<CropResponseDTO> getAllCrops();
    CropResponseDTO getCropByName(String name);
}
