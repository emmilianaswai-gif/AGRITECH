package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.NotebookRequestDTO;
import com.example.foodach.DTO.NotebookResponseDTO;
import com.example.foodach.Entity.Notebook;
import com.example.foodach.Repository.NotebookRepository;
import com.example.foodach.Service.NotebookService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotebookServiceImpl implements NotebookService {

    private final NotebookRepository repository;

    @Override
    public List<NotebookResponseDTO> getByUserId(String userId) {
        if (userId == null || userId.isBlank())
            throw new RuntimeException("User is required");
        return repository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Override
    public NotebookResponseDTO create(NotebookRequestDTO requestDTO) {
        if (requestDTO.userId() == null || requestDTO.userId().isBlank())
            throw new RuntimeException("User is required");
        if (requestDTO.title() == null || requestDTO.title().isBlank())
            throw new RuntimeException("Note title is required");

        Notebook note = new Notebook();
        note.setUserId(requestDTO.userId().trim());
        note.setTitle(requestDTO.title().trim());
        note.setContent(requestDTO.content() == null ? "" : requestDTO.content().trim());
        note.setCreatedAt(Instant.now());
        note.setUpdatedAt(Instant.now());

        return mapToResponseDTO(repository.save(note));
    }

    @Override
    public NotebookResponseDTO update(Long id, String userId, NotebookRequestDTO requestDTO) {
        if (requestDTO.title() == null || requestDTO.title().isBlank())
            throw new RuntimeException("Note title is required");

        Notebook note = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Note not found"));
        note.setTitle(requestDTO.title().trim());
        note.setContent(requestDTO.content() == null ? "" : requestDTO.content().trim());
        note.setUpdatedAt(Instant.now());

        return mapToResponseDTO(repository.save(note));
    }

    @Override
    public void delete(Long id, String userId) {
        Notebook note = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Note not found"));
        repository.delete(note);
    }

    private NotebookResponseDTO mapToResponseDTO(Notebook note) {
        return new NotebookResponseDTO(
                note.getId(),
                note.getUserId(),
                note.getTitle(),
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}