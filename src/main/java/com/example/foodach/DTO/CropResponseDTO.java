package com.example.foodach.DTO;

import java.util.List;
import com.example.foodach.DTO.SeasonResponseDTO;

public record CropResponseDTO(
        Long id,
        String name,
        String description,
        String category,
        List<SeasonResponseDTO> seasons
) {}
