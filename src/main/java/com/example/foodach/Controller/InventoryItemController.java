package com.example.foodach.Controller;

import com.example.foodach.DTO.InventoryItemRequestDTO;
import com.example.foodach.DTO.InventoryItemResponseDTO;
import com.example.foodach.Service.InventoryItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/inventory")
@RequiredArgsConstructor
public class InventoryItemController {

    private final InventoryItemService inventoryItemService;

    @PostMapping
    public ResponseEntity<InventoryItemResponseDTO> addItem(@RequestBody InventoryItemRequestDTO requestDTO) {
        return ResponseEntity.ok(inventoryItemService.addItem(requestDTO));
    }

    @GetMapping
    public ResponseEntity<List<InventoryItemResponseDTO>> getAllItems() {
        return ResponseEntity.ok(inventoryItemService.getAllItems());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryItemResponseDTO> getItem(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryItemService.getItemById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        inventoryItemService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}