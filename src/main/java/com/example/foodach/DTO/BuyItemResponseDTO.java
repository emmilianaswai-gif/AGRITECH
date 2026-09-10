package com.example.foodach.DTO;

import java.time.Instant;

public record BuyItemResponseDTO(
        Long id,
        String title,
        String category,
        String description,
        Double quantity,
        String unit,
        Double unitPrice,
        String supplier,
        String status,
        Instant createdAt
) {
}