package com.example.foodach.Controller;

import com.example.foodach.DTO.RoleAccessDTO;
import com.example.foodach.DTO.RoleAccessRequestDTO;
import com.example.foodach.DTO.RoleRequestDTO;
import com.example.foodach.Service.RoleAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/access")
@RequiredArgsConstructor
public class RoleAccessController {
    private final RoleAccessService roleAccessService;

    @GetMapping
    public ResponseEntity<List<RoleAccessDTO>> getAll() {
        return ResponseEntity.ok(roleAccessService.getAll());
    }

    @PostMapping("/roles")
    public ResponseEntity<RoleAccessDTO> addRole(@RequestBody RoleRequestDTO request) {
        return ResponseEntity.ok(roleAccessService.addRole(request.role()));
    }

    @PostMapping("/{role}")
    public ResponseEntity<RoleAccessDTO> saveRole(@PathVariable String role, @RequestBody RoleAccessRequestDTO request) {
        return ResponseEntity.ok(roleAccessService.saveRole(role, request.services()));
    }

    @DeleteMapping("/{role}")
    public ResponseEntity<Void> deleteRole(@PathVariable String role) {
        roleAccessService.deleteRole(role);
        return ResponseEntity.noContent().build();
    }
}