package com.example.foodach.Service;

import com.example.foodach.DTO.LearningResourceRequestDTO;
import com.example.foodach.DTO.LearningResourceResponseDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface LearningService {
    LearningResourceResponseDTO addResource(LearningResourceRequestDTO requestDTO, String role);
    LearningResourceResponseDTO uploadResource(LearningResourceRequestDTO requestDTO, MultipartFile file, String role);
    List<LearningResourceResponseDTO> getAllResources();
    List<LearningResourceResponseDTO> getResourcesByType(String type);
    LearningResourceResponseDTO getResourceById(Long id);
    void deleteResource(Long id, String role);
}