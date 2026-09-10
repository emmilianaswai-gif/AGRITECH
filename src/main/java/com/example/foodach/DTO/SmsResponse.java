package com.example.foodach.DTO;

import java.time.Instant;

public record SmsResponse(
        Long id,
        String fromName,
        String toName,
        String toPhone,
        String body,
        String status,
        String provider,
        Instant createdAt
) {
}