package com.example.foodach.DTO;

import java.time.Instant;

public record SaleItemRequestDTO(
        String title,
        String category,
        String description,
        Double quantity,
        String unit,
        Double unitPrice,
        Double marketPrice,
        Double feePercent,
        String status
) {
}