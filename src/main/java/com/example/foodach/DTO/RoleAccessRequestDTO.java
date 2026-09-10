package com.example.foodach.DTO;

import java.util.List;

public record RoleAccessRequestDTO(
        List<String> services
) {
}