package com.example.foodach.Controller;

import com.example.foodach.DTO.TechnicalSupportRequest;
import com.example.foodach.DTO.TechnicalSupportResponse;
import com.example.foodach.Service.TechnicalSupportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class TechnicalSupportController {

    private final TechnicalSupportService technicalSupportService;

    @GetMapping
    public ResponseEntity<List<TechnicalSupportResponse>> getAll() {
        return ResponseEntity.ok(technicalSupportService.getAll());
    }

    @PostMapping
    public ResponseEntity<TechnicalSupportResponse> add(@RequestBody TechnicalSupportRequest request) {
        return ResponseEntity.ok(technicalSupportService.add(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TechnicalSupportResponse> update(@PathVariable Long id, @RequestBody TechnicalSupportRequest request) {
        return ResponseEntity.ok(technicalSupportService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @RequestParam(required = false) String role,
                                       @RequestParam(required = false) String userId) {
        technicalSupportService.delete(id, role, userId);
        return ResponseEntity.noContent().build();
    }
}