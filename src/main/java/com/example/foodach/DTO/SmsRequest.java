package com.example.foodach.DTO;

public record SmsRequest(
        String fromName,
        String toName,
        String toPhone,
        String body
) {
}