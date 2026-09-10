package com.example.foodach.DTO;

import java.time.Instant;

public record InventoryItemRequestDTO(
        String title,
        String category,
        String supplier,
        Boolean ownProduce,
        Double costPrice,
        Double sellingPrice,
        Double quantity,
        String unit
) {
}