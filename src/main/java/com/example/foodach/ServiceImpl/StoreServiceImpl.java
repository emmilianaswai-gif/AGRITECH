package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.StoreRequestDTO;
import com.example.foodach.DTO.StoreResponseDTO;
import com.example.foodach.Entity.Role;
import com.example.foodach.Entity.Store;
import com.example.foodach.Entity.User;
import com.example.foodach.Repository.StoreRepository;
import com.example.foodach.Repository.UserRepository;
import com.example.foodach.Service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private final StoreRepository repository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public StoreResponseDTO addStore(StoreRequestDTO requestDTO) {
        if (requestDTO.name() == null || requestDTO.name().isBlank()) {
            throw new IllegalArgumentException("Store name is required");
        }
        if (requestDTO.ownerName() == null || requestDTO.ownerName().isBlank()) {
            throw new IllegalArgumentException("Owner name is required");
        }
        if (requestDTO.ownerPassword() == null || requestDTO.ownerPassword().isBlank()) {
            throw new IllegalArgumentException("A password is required for the store owner account");
        }
        if (requestDTO.phone() == null || requestDTO.phone().isBlank()) {
            throw new IllegalArgumentException("Phone number is required");
        }
        if (userRepository.existsByPhoneNumber(requestDTO.phone())) {
            throw new RuntimeException("This phone number is already registered to another account");
        }

        User owner = new User();
        owner.setFullName(requestDTO.ownerName());
        owner.setEmail(requestDTO.email());
        owner.setPassword(requestDTO.ownerPassword());
        owner.setPhoneNumber(requestDTO.phone());
        owner.setAddress(requestDTO.ownerAddress());
        owner.setLocation(requestDTO.location());
        owner.setRole(Role.FAMER.name());
        owner.setMustChangePassword(false);
        User savedOwner = userRepository.save(owner);

        Store store = new Store();
        store.setName(requestDTO.name());
        store.setOwnerId(savedOwner.getUuid());
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
                store.getOwnerId(),
                store.getCreatedAt()
        );
    }
}