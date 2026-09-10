package com.example.foodach.DTO;

import java.time.Instant;

public record InventoryItemResponseDTO(
        Long id,
        String title,
        String category,
        String supplier,
        Boolean ownProduce,
        Double costPrice,
        Double sellingPrice,
        Double quantity,
        String unit,
        Instant createdAt
) {
}