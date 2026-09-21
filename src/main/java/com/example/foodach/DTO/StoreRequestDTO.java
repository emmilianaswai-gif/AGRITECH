package com.example.foodach.DTO;

import java.time.Instant;

public record StoreRequestDTO(
        String name,
        String category,
        String location,
        String description,
        String phone,
        String email,
        Double rating,
        String ownerName,
        String ownerPassword,
        String ownerAddress
) {
}