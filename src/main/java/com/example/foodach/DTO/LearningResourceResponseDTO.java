package com.example.foodach.DTO;

import java.time.Instant;

public record LearningResourceResponseDTO(
        Long id,
        String type,
        String title,
        String description,
        String category,
        String meta,
        Integer progress,
        String status,
        String resourceUrl,
        Instant createdAt
) {
}