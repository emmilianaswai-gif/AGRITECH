package com.example.foodach.DTO;

import java.time.Instant;

public record CustomerOrderResponseDTO(
        Long id,
        Long inventoryItemId,
        String itemTitle,
        String customer,
        String customerUserId,
        String sellerUserId,
        Double quantity,
        String unit,
        Double unitPrice,
        Double costPrice,
        Double total,
        Double profit,
        String status,
        String paymentMethod,
        String customerPhone,
        String customerLocation,
        Double latitude,
        Double longitude,
        Instant createdAt
) {
}