package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.ProfileUpdateRequestDTO;
import com.example.foodach.DTO.UserRequestDTO;
import com.example.foodach.DTO.UserResponseDTO;
import com.example.foodach.Entity.Role;
import com.example.foodach.Entity.User;
import com.example.foodach.Repository.UserRepository;
import com.example.foodach.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    @Override
    public UserResponseDTO registerUser(UserRequestDTO requestDTO) {
        if ("FAMER".equals(parseRole(requestDTO.role())))
            throw new RuntimeException("Farmer accounts are created together with your agro store. Please register a store instead");

        if (userRepository.existsByPhoneNumber(requestDTO.phoneNumber()))
            throw new RuntimeException("This number already registered");
        if (requestDTO.email() != null && !requestDTO.email().isBlank()
                && userRepository.existsByEmailIgnoreCase(requestDTO.email()))
            throw new RuntimeException("This email already registered");

        User user = new User();
        user.setFullName(requestDTO.fullName());
        user.setEmail(requestDTO.email());
        user.setPassword(requestDTO.password());
        user.setPhoneNumber(requestDTO.phoneNumber());
        user.setAddress(requestDTO.address());
        user.setLocation(requestDTO.location());
        user.setRole(parseRole(requestDTO.role()));
        user.setMustChangePassword(false);

        User savedUser = userRepository.save(user);
        return mapToResponseDTO(savedUser);
    }

    @Override
    public UserResponseDTO enrollMember(UserRequestDTO requestDTO, String actorRole) {
        String actor = parseRole(actorRole);
        if (!Set.of("FAMER", "ADMIN", "SUPER_ADMIN").contains(actor))
            throw new RuntimeException("Only farmers and admins can enroll members");

        if (userRepository.existsByPhoneNumber(requestDTO.phoneNumber()))
            throw new RuntimeException("This number already registered");
        if (requestDTO.email() != null && !requestDTO.email().isBlank()
                && userRepository.existsByEmailIgnoreCase(requestDTO.email()))
            throw new RuntimeException("This email already registered");
        if (requestDTO.password() == null || requestDTO.password().isBlank())
            throw new RuntimeException("An initial password is required");

        User user = new User();
        user.setFullName(requestDTO.fullName());
        user.setEmail(requestDTO.email());
        user.setPassword(requestDTO.password());
        user.setPhoneNumber(requestDTO.phoneNumber());
        user.setAddress(requestDTO.address());
        user.setLocation(requestDTO.location());
        user.setRole(parseRole(requestDTO.role()));
        user.setMustChangePassword(true);

        User savedUser = userRepository.save(user);
        return mapToResponseDTO(savedUser);
    }

    @Override
    public UserResponseDTO changePasswordOnFirstLogin(String identifier, String oldPassword, String newPassword) {
        if (identifier == null || identifier.isBlank())
            throw new RuntimeException("Username or phone number is required");
        if (oldPassword == null || oldPassword.isBlank())
            throw new RuntimeException("Old password is required");
        if (newPassword == null || newPassword.isBlank() || newPassword.length() < 4)
            throw new RuntimeException("New password must be at least 4 characters");

        List<User> byEmail = userRepository.findAllByEmailIgnoreCase(identifier);
        User user = byEmail.isEmpty()
                ? userRepository.findByPhoneNumber(identifier)
                        .orElseThrow(() -> new RuntimeException("Account not found"))
                : byEmail.get(0);

        if (user.getPassword() == null || !user.getPassword().equals(oldPassword))
            throw new RuntimeException("Incorrect old password");
        if (oldPassword.equals(newPassword))
            throw new RuntimeException("New password must be different from the old one");

        user.setPassword(newPassword);
        user.setMustChangePassword(false);
        return mapToResponseDTO(userRepository.save(user));
    }

    @Override
    public UserResponseDTO loginUser(String identifier, String password, String requestedRole) {
        if (identifier == null || identifier.isBlank())
            throw new RuntimeException("Username or phone number is required");

        List<User> byEmail = userRepository.findAllByEmailIgnoreCase(identifier);
        User user;
        if (!byEmail.isEmpty()) {
            if (requestedRole != null && !requestedRole.isBlank()) {
                String requested = parseRole(requestedRole);
                user = byEmail.stream()
                        .filter(u -> requested.equals(u.getRole()))
                        .findFirst()
                        .orElseGet(() -> byEmail.stream()
                                .filter(u -> "SUPER_ADMIN".equals(u.getRole()))
                                .findFirst()
                                .orElse(null));
            } else {
                user = byEmail.get(0);
            }
        } else {
            user = userRepository.findByPhoneNumber(identifier)
                    .orElseThrow(() -> new RuntimeException("Account not found"));
        }

        if (user == null)
            throw new RuntimeException("Only the Super Admin can choose a login category");

        if (user.getPassword() == null || !user.getPassword().equals(password))
            throw new RuntimeException("Incorrect password");

        String sessionRole = user.getRole();
        if (requestedRole != null && !requestedRole.isBlank()) {
            String requested = parseRole(requestedRole);
            if (!requested.equals(user.getRole()) && !"SUPER_ADMIN".equals(user.getRole()))
                throw new RuntimeException("Only the Super Admin can choose a login category");
            sessionRole = requested;
        }

        return mapToResponseDTO(user, sessionRole);
    }

    @Override
    public void logout(String userId) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
    }

    @Override
    public UserResponseDTO getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponseDTO(user);
    }

    @Override
    public UserResponseDTO getUserByPhoneNumber(String phoneNumber) {
        User user = userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new RuntimeException("User phone number not found"));
        return mapToResponseDTO(user);
    }

    @Override
    public UserResponseDTO updateUserRole(String id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String normalized = parseRole(role);
        if ("SUPER_ADMIN".equals(normalized))
            throw new RuntimeException("Cannot assign the Super Admin role");
        user.setRole(normalized);
        return mapToResponseDTO(userRepository.save(user));
    }

    @Override
    public UserResponseDTO updateProfile(String id, ProfileUpdateRequestDTO requestDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (requestDTO.fullName() == null || requestDTO.fullName().isBlank())
            throw new RuntimeException("Full name is required");
        if (requestDTO.phoneNumber() == null || requestDTO.phoneNumber().isBlank())
            throw new RuntimeException("Phone number is required");

        String phone = requestDTO.phoneNumber().trim();
        userRepository.findByPhoneNumber(phone).filter(u -> !u.getUuid().equals(user.getUuid()))
                .ifPresent(u -> {
                    throw new RuntimeException("This number is already registered to another account");
                });

        String email = requestDTO.email() == null ? null : requestDTO.email().trim();
        if (email != null && !email.isBlank()) {
            userRepository.findAllByEmailIgnoreCase(email).stream()
                    .filter(u -> !u.getUuid().equals(user.getUuid()))
                    .findFirst()
                    .ifPresent(u -> {
                        throw new RuntimeException("This email is already registered to another account");
                    });
        }

        user.setFullName(requestDTO.fullName().trim());
        user.setPhoneNumber(phone);
        user.setEmail(email == null || email.isBlank() ? null : email);
        user.setAddress(requestDTO.address() == null ? null : requestDTO.address().trim());
        user.setLocation(requestDTO.location() == null ? null : requestDTO.location().trim());

        return mapToResponseDTO(userRepository.save(user));
    }

    @Override
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    public String parseRole(String role) {
        if (role == null || role.isBlank()) return Role.FAMER.name();
        String normalized = role.trim().toUpperCase(Locale.ROOT);
        try {
            Role.valueOf(normalized);
            return normalized;
        } catch (IllegalArgumentException e) {
            return normalized;
        }
    }

    private UserResponseDTO mapToResponseDTO(User user) {
        return mapToResponseDTO(user, user.getRole());
    }

    private UserResponseDTO mapToResponseDTO(User user, String role) {
        return new UserResponseDTO(
                user.getUuid(),
                user.getFullName(),
                user.getEmail(),
                null,
                user.getPhoneNumber(),
                user.getAddress(),
                user.getLocation(),
                role != null ? role : Role.FAMER.name(),
                user.getMustChangePassword() != null && user.getMustChangePassword()
        );
    }
}