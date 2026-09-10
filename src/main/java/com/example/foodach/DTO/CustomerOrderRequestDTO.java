package com.example.foodach.DTO;

public record CustomerOrderRequestDTO(
        Long inventoryItemId,
        String customer,
        Double quantity,
        String status,
        String customerUserId,
        String sellerUserId,
        String paymentMethod,
        String phone,
        String location,
        Double latitude,
        Double longitude
) {
}