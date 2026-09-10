package com.example.foodach.Controller;

import com.example.foodach.DTO.NotebookRequestDTO;
import com.example.foodach.DTO.NotebookResponseDTO;
import com.example.foodach.Service.NotebookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notebook")
@RequiredArgsConstructor
public class NotebookController {

    private final NotebookService notebookService;

    @GetMapping
    public ResponseEntity<List<NotebookResponseDTO>> getNotes(@RequestParam("userId") String userId) {
        return ResponseEntity.ok(notebookService.getByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<NotebookResponseDTO> createNote(@RequestBody NotebookRequestDTO requestDTO) {
        return ResponseEntity.ok(notebookService.create(requestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NotebookResponseDTO> updateNote(
            @PathVariable Long id,
            @RequestParam("userId") String userId,
            @RequestBody NotebookRequestDTO requestDTO) {
        return ResponseEntity.ok(notebookService.update(id, userId, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable Long id,
            @RequestParam("userId") String userId) {
        notebookService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}