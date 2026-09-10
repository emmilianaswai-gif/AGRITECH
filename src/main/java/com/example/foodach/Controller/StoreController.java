package com.example.foodach.Controller;

import com.example.foodach.DTO.StoreRequestDTO;
import com.example.foodach.DTO.StoreResponseDTO;
import com.example.foodach.Service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @PostMapping
    public ResponseEntity<StoreResponseDTO> addStore(@RequestBody StoreRequestDTO requestDTO) {
        return ResponseEntity.ok(storeService.addStore(requestDTO));
    }

    @GetMapping
    public ResponseEntity<List<StoreResponseDTO>> getAllStores() {
        return ResponseEntity.ok(storeService.getAllStores());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StoreResponseDTO> getStore(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.getStoreById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStore(@PathVariable Long id) {
        storeService.deleteStore(id);
        return ResponseEntity.noContent().build();
    }
}