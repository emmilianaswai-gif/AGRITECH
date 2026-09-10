package com.example.foodach.DTO;

public record LearningResourceRequestDTO(
        String type,
        String title,
        String description,
        String category,
        String meta,
        Integer progress,
        String status,
        String resourceUrl
) {
}