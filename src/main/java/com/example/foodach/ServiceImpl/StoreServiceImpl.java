package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.StoreRequestDTO;
import com.example.foodach.DTO.StoreResponseDTO;
import com.example.foodach.Entity.Store;
import com.example.foodach.Repository.StoreRepository;
import com.example.foodach.Service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private final StoreRepository repository;

    @Override
    public StoreResponseDTO addStore(StoreRequestDTO requestDTO) {
        if (requestDTO.name() == null || requestDTO.name().isBlank()) {
            throw new IllegalArgumentException("Store name is required");
        }

        Store store = new Store();
        store.setName(requestDTO.name());
        store.setCategory(requestDTO.category());
        store.setLocation(requestDTO.location());
        store.setDescription(requestDTO.description());
        store.setPhone(requestDTO.phone());
        store.setEmail(requestDTO.email());
        store.setRating(requestDTO.rating());
        store.setCreatedAt(Instant.now());

        return mapToResponseDTO(repository.save(store));
    }

    @Override
    public List<StoreResponseDTO> getAllStores() {
        return repository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public StoreResponseDTO getStoreById(Long id) {
        return repository.findById(id)
                .map(this::mapToResponseDTO)
                .orElseThrow(() -> new RuntimeException("Store not found"));
    }

    @Override
    public void deleteStore(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Store not found");
        }
        repository.deleteById(id);
    }

    private StoreResponseDTO mapToResponseDTO(Store store) {
        return new StoreResponseDTO(
                store.getId(),
                store.getName(),
                store.getCategory(),
                store.getLocation(),
                store.getDescription(),
                store.getPhone(),
                store.getEmail(),
                store.getRating(),
                store.getCreatedAt()
        );
    }
}