package com.example.foodach.Service;

import com.example.foodach.DTO.NotebookRequestDTO;
import com.example.foodach.DTO.NotebookResponseDTO;

import java.util.List;

public interface NotebookService {

    List<NotebookResponseDTO> getByUserId(String userId);

    NotebookResponseDTO create(NotebookRequestDTO requestDTO);

    NotebookResponseDTO update(Long id, String userId, NotebookRequestDTO requestDTO);

    void delete(Long id, String userId);
}