package com.example.foodach.DTO;

import java.time.Instant;

public record TechnicalSupportResponse(
        Long id,
        String name,
        String contact,
        String phone,
        String email,
        String category,
        String description,
        String role,
        String userId,
        Instant createdAt,
        Instant updatedAt
) {
}