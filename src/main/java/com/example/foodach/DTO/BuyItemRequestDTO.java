package com.example.foodach.DTO;

import java.time.Instant;

public record BuyItemRequestDTO(
        String title,
        String category,
        String description,
        Double quantity,
        String unit,
        Double unitPrice,
        String supplier,
        String status
) {
}