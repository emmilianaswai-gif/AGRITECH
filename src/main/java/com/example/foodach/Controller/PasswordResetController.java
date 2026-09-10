package com.example.foodach.Controller;

import com.example.foodach.DTO.ForgotPasswordRequestDTO;
import com.example.foodach.DTO.ResetPasswordRequestDTO;
import com.example.foodach.Service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody ForgotPasswordRequestDTO request) {
        return ResponseEntity.ok(Map.of("message", passwordResetService.requestOtp(request)));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody ResetPasswordRequestDTO request) {
        return ResponseEntity.ok(Map.of("message", passwordResetService.resetPassword(request)));
    }
}