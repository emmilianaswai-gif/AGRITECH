package com.example.foodach.Service;

import com.example.foodach.DTO.ConversationDTO;
import com.example.foodach.DTO.MessageRequestDTO;
import com.example.foodach.DTO.MessageResponseDTO;

import java.util.List;

public interface MessageService {
    MessageResponseDTO sendMessage(MessageRequestDTO requestDTO);
    List<MessageResponseDTO> getConversation(String userId, String partnerId);
    List<ConversationDTO> getConversations(String userId);
}