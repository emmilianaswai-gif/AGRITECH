package com.example.foodach.Controller;

import com.example.foodach.DTO.SaleItemRequestDTO;
import com.example.foodach.DTO.SaleItemResponseDTO;
import com.example.foodach.Service.SaleItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleItemController {

    private final SaleItemService saleItemService;

    @PostMapping
    public ResponseEntity<SaleItemResponseDTO> addItem(@RequestBody SaleItemRequestDTO requestDTO) {
        return ResponseEntity.ok(saleItemService.addItem(requestDTO));
    }

    @GetMapping
    public ResponseEntity<List<SaleItemResponseDTO>> getAllItems() {
        return ResponseEntity.ok(saleItemService.getAllItems());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleItemResponseDTO> getItem(@PathVariable Long id) {
        return ResponseEntity.ok(saleItemService.getItemById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        saleItemService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}