package com.example.foodach.DTO;

import java.time.Instant;

public record StoreResponseDTO(
        Long id,
        String name,
        String category,
        String location,
        String description,
        String phone,
        String email,
        Double rating,
        String ownerId,
        Instant createdAt
) {
}