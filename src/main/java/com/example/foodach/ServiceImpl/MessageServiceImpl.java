package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.ConversationDTO;
import com.example.foodach.DTO.MessageRequestDTO;
import com.example.foodach.DTO.MessageResponseDTO;
import com.example.foodach.Entity.Message;
import com.example.foodach.Entity.User;
import com.example.foodach.Repository.MessageRepository;
import com.example.foodach.Repository.UserRepository;
import com.example.foodach.Service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Override
    public MessageResponseDTO sendMessage(MessageRequestDTO requestDTO) {
        if (requestDTO.content() == null || requestDTO.content().isBlank())
            throw new RuntimeException("Message cannot be empty");
        if (requestDTO.senderId() == null || requestDTO.receiverId() == null)
            throw new RuntimeException("Sender and receiver are required");
        if (requestDTO.senderId().equals(requestDTO.receiverId()))
            throw new RuntimeException("You cannot message yourself");

        User sender = userRepository.findById(requestDTO.senderId())
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(requestDTO.receiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Message message = new Message();
        message.setSenderId(sender.getUuid());
        message.setReceiverId(receiver.getUuid());
        message.setSenderName(sender.getFullName());
        message.setReceiverName(receiver.getFullName());
        message.setContent(requestDTO.content().trim());
        message.setCreatedAt(Instant.now());

        return mapToResponseDTO(messageRepository.save(message));
    }

    @Override
    public List<MessageResponseDTO> getConversation(String userId, String partnerId) {
        return messageRepository.findConversation(userId, partnerId).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Override
    public List<ConversationDTO> getConversations(String userId) {
        List<Message> messages = messageRepository.findAllInvolvingUser(userId);
        Map<String, ConversationDTO> byPartner = new LinkedHashMap<>();

        for (Message m : messages) {
            String partnerId = m.getSenderId().equals(userId) ? m.getReceiverId() : m.getSenderId();
            if (byPartner.containsKey(partnerId)) continue;

            User partner = userRepository.findById(partnerId).orElse(null);
            String partnerName = partner != null ? partner.getFullName() : "Unknown";
            String partnerRole = partner != null && partner.getRole() != null ? partner.getRole() : "";
            String prefix = m.getSenderId().equals(userId) ? "You: " : "";

            byPartner.put(partnerId, new ConversationDTO(
                    partnerId,
                    partnerName,
                    partnerRole,
                    prefix + m.getContent(),
                    m.getCreatedAt() != null ? m.getCreatedAt().toString() : null
            ));
        }

        return new ArrayList<>(byPartner.values());
    }

    private MessageResponseDTO mapToResponseDTO(Message m) {
        return new MessageResponseDTO(
                m.getId(),
                m.getSenderId(),
                m.getReceiverId(),
                m.getSenderName(),
                m.getReceiverName(),
                m.getContent(),
                m.getCreatedAt() != null ? m.getCreatedAt().toString() : null
        );
    }
}