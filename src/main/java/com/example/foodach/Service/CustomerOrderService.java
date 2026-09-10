package com.example.foodach.Service;

import com.example.foodach.DTO.CollectionRequestDTO;
import com.example.foodach.DTO.CustomerOrderRequestDTO;
import com.example.foodach.DTO.CustomerOrderResponseDTO;
import com.example.foodach.DTO.InventoryTotalsDTO;
import com.example.foodach.DTO.TradingStatsDTO;

import java.util.List;

public interface CustomerOrderService {
    CustomerOrderResponseDTO addOrder(CustomerOrderRequestDTO requestDTO);
    List<CustomerOrderResponseDTO> getAllOrders();
    CustomerOrderResponseDTO getOrderById(Long id);
    void deleteOrder(Long id);
    CustomerOrderResponseDTO updateOrderStatus(Long id, String status);
    InventoryTotalsDTO getProfitSummary();
    TradingStatsDTO getTradingStats();
    CustomerOrderResponseDTO collectDebt(Long id, CollectionRequestDTO requestDTO);
}