package com.example.foodach.Controller;

import com.example.foodach.DTO.ConversationDTO;
import com.example.foodach.DTO.MessageRequestDTO;
import com.example.foodach.DTO.MessageResponseDTO;
import com.example.foodach.Service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping("/send")
    public ResponseEntity<MessageResponseDTO> sendMessage(@RequestBody MessageRequestDTO requestDTO) {
        return ResponseEntity.ok(messageService.sendMessage(requestDTO));
    }

    @GetMapping("/conversation")
    public ResponseEntity<List<MessageResponseDTO>> getConversation(
            @RequestParam("userId") String userId,
            @RequestParam("partner") String partner
    ) {
        return ResponseEntity.ok(messageService.getConversation(userId, partner));
    }

    @GetMapping("/{userId}/conversations")
    public ResponseEntity<List<ConversationDTO>> getConversations(@PathVariable String userId) {
        return ResponseEntity.ok(messageService.getConversations(userId));
    }
}