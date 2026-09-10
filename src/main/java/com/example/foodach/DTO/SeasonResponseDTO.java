package com.example.foodach.DTO;

public record SeasonResponseDTO(
        long id,
        String name,
        String startMonth,
        String endMonth,
        String suitableRegion,
        String recommendedFertilizer,
        String weatherRequirements,
        String CropeName
) {
}
