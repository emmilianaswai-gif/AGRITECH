package com.example.foodach.Controller;

import com.example.foodach.DTO.CollectionRequestDTO;
import com.example.foodach.DTO.CustomerOrderRequestDTO;
import com.example.foodach.DTO.CustomerOrderResponseDTO;
import com.example.foodach.DTO.InventoryTotalsDTO;
import com.example.foodach.DTO.OrderStatusRequestDTO;
import com.example.foodach.DTO.TradingStatsDTO;
import com.example.foodach.Service.CustomerOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class CustomerOrderController {

    private final CustomerOrderService customerOrderService;

    @PostMapping
    public ResponseEntity<CustomerOrderResponseDTO> addOrder(@RequestBody CustomerOrderRequestDTO requestDTO) {
        return ResponseEntity.ok(customerOrderService.addOrder(requestDTO));
    }

    @GetMapping
    public ResponseEntity<List<CustomerOrderResponseDTO>> getAllOrders() {
        return ResponseEntity.ok(customerOrderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerOrderResponseDTO> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(customerOrderService.getOrderById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        customerOrderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<CustomerOrderResponseDTO> updateStatus(
            @PathVariable Long id,
            @RequestBody OrderStatusRequestDTO requestDTO) {
        return ResponseEntity.ok(customerOrderService.updateOrderStatus(id, requestDTO.status()));
    }

    @GetMapping("/summary")
    public ResponseEntity<InventoryTotalsDTO> getSummary() {
        return ResponseEntity.ok(customerOrderService.getProfitSummary());
    }

    @GetMapping("/trading-stats")
    public ResponseEntity<TradingStatsDTO> getTradingStats() {
        return ResponseEntity.ok(customerOrderService.getTradingStats());
    }

    @PostMapping("/{id}/collect")
    public ResponseEntity<CustomerOrderResponseDTO> collectDebt(
            @PathVariable Long id,
            @RequestBody(required = false) CollectionRequestDTO requestDTO) {
        return ResponseEntity.ok(customerOrderService.collectDebt(id, requestDTO));
    }
}