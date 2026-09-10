package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.LearningResourceRequestDTO;
import com.example.foodach.DTO.LearningResourceResponseDTO;
import com.example.foodach.Entity.LearningResource;
import com.example.foodach.Entity.LearningResourceType;
import com.example.foodach.Repository.LearningResourceRepository;
import com.example.foodach.Service.LearningService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningServiceImpl implements LearningService {

    private final LearningResourceRepository repository;

    @Value("${app.upload.dir:uploads/learning}")
    private String uploadDir;

    private static final Set<String> PROVIDER_ROLES = Set.of("FAMER", "ADMIN", "SUPER_ADMIN");

    private boolean canProvide(String role) {
        return role != null && PROVIDER_ROLES.contains(role.trim().toUpperCase(Locale.ROOT));
    }

    @Override
    public LearningResourceResponseDTO addResource(LearningResourceRequestDTO requestDTO, String role) {
        if (!canProvide(role))
            throw new RuntimeException("Only farmers and admins can publish learning tips");
        return save(parseRequest(requestDTO), requestDTO.resourceUrl());
    }

    @Override
    public LearningResourceResponseDTO uploadResource(LearningResourceRequestDTO requestDTO, MultipartFile file, String role) {
        if (!canProvide(role))
            throw new RuntimeException("Only farmers and admins can publish learning tips");
        if (file == null || file.isEmpty()) {
            return save(parseRequest(requestDTO), requestDTO.resourceUrl());
        }

        String storedUrl = storeFile(file);
        return save(parseRequest(requestDTO), storedUrl);
    }

    @Override
    public List<LearningResourceResponseDTO> getAllResources() {
        return repository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<LearningResourceResponseDTO> getResourcesByType(String type) {
        return repository.findByType(parseType(type)).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public LearningResourceResponseDTO getResourceById(Long id) {
        LearningResource resource = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Learning resource not found"));
        return mapToResponseDTO(resource);
    }

    @Override
    public void deleteResource(Long id, String role) {
        if (!canProvide(role))
            throw new RuntimeException("Only farmers and admins can remove learning tips");
        if (!repository.existsById(id)) {
            throw new RuntimeException("Learning resource not found");
        }
        repository.deleteById(id);
    }

    private LearningResourceRequestDTO parseRequest(LearningResourceRequestDTO requestDTO) {
        if (requestDTO.type() == null || requestDTO.type().isBlank()) {
            throw new IllegalArgumentException("Resource type is required (COURSE, VIDEO, CALENDAR, CERTIFICATION)");
        }
        if (requestDTO.title() == null || requestDTO.title().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }
        return requestDTO;
    }

    private LearningResourceResponseDTO save(LearningResourceRequestDTO requestDTO, String resourceUrl) {
        LearningResource resource = new LearningResource();
        resource.setType(parseType(requestDTO.type()));
        resource.setTitle(requestDTO.title());
        resource.setDescription(requestDTO.description());
        resource.setCategory(requestDTO.category());
        resource.setMeta(requestDTO.meta());
        resource.setProgress(requestDTO.progress());
        resource.setStatus(requestDTO.status());
        resource.setResourceUrl(resourceUrl);
        resource.setCreatedAt(Instant.now());

        LearningResource saved = repository.save(resource);
        return mapToResponseDTO(saved);
    }

    private String storeFile(MultipartFile file) {
        try {
            Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);

            String original = file.getOriginalFilename();
            String extension = "";
            if (original != null && original.contains(".")) {
                extension = original.substring(original.lastIndexOf("."));
            }
            String storedName = UUID.randomUUID().toString().replace("-", "") + extension;
            Path target = dir.resolve(storedName);

            try (var in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return "/uploads/learning/" + storedName;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store uploaded file: " + ex.getMessage());
        }
    }

    private LearningResourceType parseType(String type) {
        try {
            return LearningResourceType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid resource type: " + type +
                    " (allowed: COURSE, VIDEO, CALENDAR, CERTIFICATION)");
        }
    }

    private LearningResourceResponseDTO mapToResponseDTO(LearningResource resource) {
        return new LearningResourceResponseDTO(
                resource.getId(),
                resource.getType() == null ? null : resource.getType().name(),
                resource.getTitle(),
                resource.getDescription(),
                resource.getCategory(),
                resource.getMeta(),
                resource.getProgress(),
                resource.getStatus(),
                resource.getResourceUrl(),
                resource.getCreatedAt()
        );
    }
}