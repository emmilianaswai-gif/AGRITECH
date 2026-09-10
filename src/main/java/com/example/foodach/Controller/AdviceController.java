package com.example.foodach.Controller;

import com.example.foodach.DTO.AiModelsResponseDTO;
import com.example.foodach.DTO.ChatRequestDTO;
import com.example.foodach.DTO.ChatResponseDTO;
import com.example.foodach.Service.AiAdviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/advice")
@RequiredArgsConstructor
public class AdviceController {

    private final AiAdviceService aiAdviceService;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponseDTO> chat(@RequestBody ChatRequestDTO chatRequestDTO) {
        ChatResponseDTO response = aiAdviceService.chat(chatRequestDTO);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/models")
    public ResponseEntity<AiModelsResponseDTO> getModels() {
        return ResponseEntity.ok(aiAdviceService.getAvailableModels());
    }
}