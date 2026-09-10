package com.example.foodach.DTO;

import java.time.Instant;

public record NotebookResponseDTO(
        Long id,
        String userId,
        String title,
        String content,
        Instant createdAt,
        Instant updatedAt
) {
}