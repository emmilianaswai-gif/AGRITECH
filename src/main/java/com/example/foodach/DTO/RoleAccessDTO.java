package com.example.foodach.DTO;

import java.util.List;

public record RoleAccessDTO(
        String role,
        List<String> services
) {
}