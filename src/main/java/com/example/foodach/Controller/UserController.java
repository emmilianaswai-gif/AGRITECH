package com.example.foodach.Controller;

import com.example.foodach.DTO.ProfileUpdateRequestDTO;
import com.example.foodach.DTO.UserRequestDTO;
import com.example.foodach.DTO.UserResponseDTO;
import com.example.foodach.DTO.RoleRequestDTO;
import com.example.foodach.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserResponseDTO> registerUser(@RequestBody UserRequestDTO requestDTO) {
        UserResponseDTO createdUser = userService.registerUser(requestDTO);
        return ResponseEntity.ok(createdUser);
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponseDTO> loginUser(@RequestBody Map<String, String> credentials) {
        UserResponseDTO user = userService.loginUser(
                credentials.get("identifier"),
                credentials.get("password"),
                credentials.get("role")
        );
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logoutUser(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        userService.logout(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/enroll")
    public ResponseEntity<UserResponseDTO> enrollMember(
            @RequestBody UserRequestDTO requestDTO,
            @RequestParam String role) {
        return ResponseEntity.ok(userService.enrollMember(requestDTO, role));
    }

    @PostMapping("/change-password")
    public ResponseEntity<UserResponseDTO> changePassword(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userService.changePasswordOnFirstLogin(
                body.get("identifier"),
                body.get("oldPassword"),
                body.get("newPassword")));
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable String id) {
        UserResponseDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserResponseDTO> updateUserRole(@PathVariable String id, @RequestBody RoleRequestDTO request) {
        return ResponseEntity.ok(userService.updateUserRole(id, request.role()));
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<UserResponseDTO> updateProfile(
            @PathVariable String id,
            @RequestBody ProfileUpdateRequestDTO requestDTO) {
        return ResponseEntity.ok(userService.updateProfile(id, requestDTO));
    }

    @GetMapping("/phone/{phoneNumber}")
    public ResponseEntity<UserResponseDTO> getUserByPhoneNumber(@PathVariable String phoneNumber) {
        UserResponseDTO user = userService.getUserByPhoneNumber(phoneNumber);
        return ResponseEntity.ok(user);
    }
}