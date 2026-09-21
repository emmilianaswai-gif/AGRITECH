package com.example.foodach.Service;

import com.example.foodach.DTO.ProfileUpdateRequestDTO;
import com.example.foodach.DTO.UserRequestDTO;
import com.example.foodach.DTO.UserResponseDTO;

import java.util.List;

public interface UserService {
    UserResponseDTO registerUser(UserRequestDTO userRequestDTO);
    UserResponseDTO loginUser(String identifier, String password, String requestedRole);
    void logout(String userId);
    UserResponseDTO enrollMember(UserRequestDTO userRequestDTO, String actorRole);
    UserResponseDTO changePasswordOnFirstLogin(String identifier, String oldPassword, String newPassword);
    UserResponseDTO getUserById(String id);
    UserResponseDTO getUserByPhoneNumber(String phoneNumber);
    UserResponseDTO updateUserRole(String id, String role);
    UserResponseDTO updateProfile(String id, ProfileUpdateRequestDTO requestDTO);
    List<UserResponseDTO> getAllUsers();
}