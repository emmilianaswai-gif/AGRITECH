package com.example.foodach.Service;

import com.example.foodach.DTO.AiModelsResponseDTO;
import com.example.foodach.DTO.ChatRequestDTO;
import com.example.foodach.DTO.ChatResponseDTO;

public interface AiAdviceService {
    ChatResponseDTO chat(ChatRequestDTO chatRequestDTO);
    AiModelsResponseDTO getAvailableModels();
}