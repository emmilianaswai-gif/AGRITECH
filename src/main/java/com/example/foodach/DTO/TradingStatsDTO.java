package com.example.foodach.DTO;

public record TradingStatsDTO(
        double todaySales,
        double todayProfit,
        double monthSales,
        double monthProfit,
        double sixMonthSales,
        double sixMonthProfit,
        double yearSales,
        double yearProfit,
        double allTimeSales,
        double allTimeProfit,
        double cashCollected,
        double checkCollected,
        double outstandingDebt,
        double pendingTotal,
        long outstandingDebtCount
) {
}