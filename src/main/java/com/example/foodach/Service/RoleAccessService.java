package com.example.foodach.Service;

import com.example.foodach.DTO.RoleAccessDTO;

import java.util.List;

public interface RoleAccessService {
    List<RoleAccessDTO> getAll();
    RoleAccessDTO saveRole(String role, List<String> services);
    RoleAccessDTO addRole(String role);
    void deleteRole(String role);
    boolean canAccess(String role, String serviceId);
}