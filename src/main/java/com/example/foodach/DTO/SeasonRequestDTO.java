package com.example.foodach.DTO;

public record SeasonRequestDTO(
         String name,
         String startMonth,
         String endMonth,
         String suitableRegion,
         String recommendedFertilizer,
         String weatherRequirements,
         Long cropId

) {
}
