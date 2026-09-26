package com.example.foodach.ServiceImpl;

import com.example.foodach.Config.TenantContext;
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
import java.util.Optional;
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

        String currentUserId = TenantContext.get();
        if (currentUserId != null && !currentUserId.isBlank()) {
            return addStoreForCurrentUser(requestDTO, currentUserId);
        }
        return addStoreLegacy(requestDTO);
    }

    private StoreResponseDTO addStoreForCurrentUser(StoreRequestDTO requestDTO, String currentUserId) {
        User owner = userRepository.findById(currentUserId).orElse(null);
        if (owner == null) {
            throw new RuntimeException("User identity is required");
        }
        if ("CUSTOMER".equalsIgnoreCase(owner.getRole())) {
            owner.setRole(Role.FAMER.name());
            userRepository.save(owner);
        }

        Store store = new Store();
        store.setName(requestDTO.name().trim());
        store.setOwnerId(currentUserId);
        store.setCategory(requestDTO.category());
        store.setLocation(requestDTO.location());
        store.setCountry(requestDTO.country());
        store.setRegion(requestDTO.region());
        store.setDescription(requestDTO.description());
        store.setPhone(requestDTO.phone());
        store.setEmail(requestDTO.email());
        store.setRating(requestDTO.rating());
        store.setCreatedAt(Instant.now());

        return mapToResponseDTO(repository.save(store));
    }

    private StoreResponseDTO addStoreLegacy(StoreRequestDTO requestDTO) {
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
        store.setCountry(requestDTO.country());
        store.setRegion(requestDTO.region());
        store.setDescription(requestDTO.description());
        store.setPhone(requestDTO.phone());
        store.setEmail(requestDTO.email());
        store.setRating(requestDTO.rating());
        store.setCreatedAt(Instant.now());

        return mapToResponseDTO(repository.save(store));
    }

    @Override
    public List<StoreResponseDTO> getMyStores() {
        String currentUserId = TenantContext.get();
        if (currentUserId == null || currentUserId.isBlank()) {
            throw new IllegalArgumentException("User identity is required");
        }
        return repository.findByOwnerId(currentUserId).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<StoreResponseDTO> getAllStores(String country, String region) {
        return repository.findAll().stream()
                .filter(s -> country == null || country.isBlank()
                        || country.equalsIgnoreCase(s.getCountry()))
                .filter(s -> region == null || region.isBlank()
                        || region.equalsIgnoreCase(s.getRegion()))
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
        String currentUserId = TenantContext.get();
        Store store = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Store not found"));
        boolean owner = currentUserId != null && currentUserId.equals(store.getOwnerId());
        boolean admin = currentUserId != null && isAdmin(currentUserId);
        if (!owner && !admin) {
            throw new RuntimeException("Store not found");
        }
        repository.deleteById(id);
    }

    private boolean isAdmin(String userId) {
        Optional<User> user = userRepository.findById(userId);
        return user.isPresent() && ("ADMIN".equalsIgnoreCase(user.get().getRole())
                || "SUPER_ADMIN".equalsIgnoreCase(user.get().getRole()));
    }

    private StoreResponseDTO mapToResponseDTO(Store store) {
        return new StoreResponseDTO(
                store.getId(),
                store.getName(),
                store.getCategory(),
                store.getLocation(),
                store.getCountry(),
                store.getRegion(),
                store.getDescription(),
                store.getPhone(),
                store.getEmail(),
                store.getRating(),
                store.getOwnerId(),
                store.getCreatedAt()
        );
    }
}