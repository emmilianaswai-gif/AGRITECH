package com.example.foodach.DTO;

import java.util.List;

public record AiModelsResponseDTO(
        String defaultModel,
        List<String> models
) {
}