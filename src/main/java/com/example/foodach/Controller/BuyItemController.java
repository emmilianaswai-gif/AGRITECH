package com.example.foodach.Controller;

import com.example.foodach.DTO.BuyItemRequestDTO;
import com.example.foodach.DTO.BuyItemResponseDTO;
import com.example.foodach.Service.BuyItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buy")
@RequiredArgsConstructor
public class BuyItemController {

    private final BuyItemService buyItemService;

    @PostMapping
    public ResponseEntity<BuyItemResponseDTO> addItem(@RequestBody BuyItemRequestDTO requestDTO) {
        return ResponseEntity.ok(buyItemService.addItem(requestDTO));
    }

    @GetMapping
    public ResponseEntity<List<BuyItemResponseDTO>> getAllItems() {
        return ResponseEntity.ok(buyItemService.getAllItems());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BuyItemResponseDTO> getItem(@PathVariable Long id) {
        return ResponseEntity.ok(buyItemService.getItemById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        buyItemService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}