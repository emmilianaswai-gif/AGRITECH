package com.example.foodach.DTO;

import java.time.Instant;

public record WalletTransactionDTO(
        Long id,
        String direction,
        String category,
        String description,
        Double amount,
        Long orderId,
        Instant createdAt
) {
}