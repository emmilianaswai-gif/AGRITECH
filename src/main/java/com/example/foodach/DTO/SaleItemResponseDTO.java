package com.example.foodach.DTO;

import java.time.Instant;

public record SaleItemResponseDTO(
        Long id,
        String title,
        String category,
        String description,
        Double quantity,
        String unit,
        Double unitPrice,
        Double marketPrice,
        Double feePercent,
        String status,
        Instant createdAt
) {
}