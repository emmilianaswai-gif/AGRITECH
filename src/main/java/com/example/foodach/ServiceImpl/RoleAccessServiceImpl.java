package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.RoleAccessDTO;
import com.example.foodach.Entity.RoleAccessConfig;
import com.example.foodach.Repository.RoleAccessConfigRepository;
import com.example.foodach.Service.RoleAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleAccessServiceImpl implements RoleAccessService {

    private final RoleAccessConfigRepository repository;

    private String normalize(String role) {
        return role == null ? "" : role.trim().toUpperCase(Locale.ROOT);
    }

    @Override
    public List<RoleAccessDTO> getAll() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RoleAccessDTO saveRole(String role, List<String> services) {
        String normalized = normalize(role);
        if (normalized.isEmpty()) throw new IllegalArgumentException("Role name is required");
        if ("SUPER_ADMIN".equals(normalized))
            throw new IllegalArgumentException("Super Admin is always full access and cannot be listed");

        RoleAccessConfig config = repository.findByRole(normalized).orElseGet(() -> {
            RoleAccessConfig c = new RoleAccessConfig();
            c.setRole(normalized);
            return c;
        });

        List<String> cleaned = new ArrayList<>();
        if (services != null) {
            Set<String> seen = new LinkedHashSet<>();
            for (String s : services) {
                if (s != null && !s.isBlank() && seen.add(s.trim())) cleaned.add(s.trim());
            }
        }
        config.setServices(cleaned);
        return toDTO(repository.save(config));
    }

    @Override
    @Transactional
    public RoleAccessDTO addRole(String role) {
        String normalized = normalize(role);
        if (normalized.isEmpty()) throw new IllegalArgumentException("Role name is required");
        if ("SUPER_ADMIN".equals(normalized))
            throw new IllegalArgumentException("Super Admin is always full access and cannot be added");

        RoleAccessConfig config = repository.findByRole(normalized).orElseGet(() -> {
            RoleAccessConfig c = new RoleAccessConfig();
            c.setRole(normalized);
            c.setServices(new ArrayList<>());
            return c;
        });
        return toDTO(repository.save(config));
    }

    @Override
    @Transactional
    public void deleteRole(String role) {
        String normalized = normalize(role);
        if ("SUPER_ADMIN".equals(normalized))
            throw new IllegalArgumentException("Super Admin cannot be removed");
        repository.deleteByRole(normalized);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canAccess(String role, String serviceId) {
        if (role == null || serviceId == null) return false;
        if ("SUPER_ADMIN".equalsIgnoreCase(role)) return true;
        return repository.findByRole(role.toUpperCase(Locale.ROOT))
                .map(c -> c.getServices().contains(serviceId))
                .orElse(false);
    }

    private RoleAccessDTO toDTO(RoleAccessConfig config) {
        return new RoleAccessDTO(config.getRole(), config.getServices());
    }
}