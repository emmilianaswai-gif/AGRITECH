package com.example.foodach.DTO;

import java.time.Instant;

public record PaymentResponseDTO(
        Long id,
        String reference,
        String type,
        String provider,
        String phone,
        String accountNumber,
        String accountName,
        Double amount,
        String status,
        String note,
        Instant createdAt,
        Instant completedAt
) {
}