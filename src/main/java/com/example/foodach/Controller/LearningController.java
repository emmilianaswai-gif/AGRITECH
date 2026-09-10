package com.example.foodach.Controller;

import com.example.foodach.DTO.LearningResourceRequestDTO;
import com.example.foodach.DTO.LearningResourceResponseDTO;
import com.example.foodach.Service.LearningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;

    @PostMapping
    public ResponseEntity<LearningResourceResponseDTO> addResource(
            @RequestBody LearningResourceRequestDTO requestDTO,
            @RequestParam(required = false) String role) {
        LearningResourceResponseDTO created = learningService.addResource(requestDTO, role);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/upload")
    public ResponseEntity<LearningResourceResponseDTO> uploadResource(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam("type") String type,
            @RequestParam("title") String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String meta,
            @RequestParam(required = false) Integer progress,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String resourceUrl,
            @RequestParam(required = false) String role) {
        LearningResourceRequestDTO dto = new LearningResourceRequestDTO(
                type, title, description, category, meta, progress, status, resourceUrl);
        LearningResourceResponseDTO created = learningService.uploadResource(dto, file, role);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public ResponseEntity<List<LearningResourceResponseDTO>> getResources(
            @RequestParam(required = false) String type) {
        List<LearningResourceResponseDTO> resources = type == null || type.isBlank()
                ? learningService.getAllResources()
                : learningService.getResourcesByType(type);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LearningResourceResponseDTO> getResource(@PathVariable Long id) {
        return ResponseEntity.ok(learningService.getResourceById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id, @RequestParam(required = false) String role) {
        learningService.deleteResource(id, role);
        return ResponseEntity.noContent().build();
    }
}