package com.example.foodach.DTO;

public record InventoryTotalsDTO(
        long inventoryCount,
        double inventoryValue,
        long orderCount,
        double totalSales,
        double totalProfit
) {
}