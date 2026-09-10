package com.example.foodach.Service;

import com.example.foodach.DTO.ForgotPasswordRequestDTO;
import com.example.foodach.DTO.ResetPasswordRequestDTO;

public interface PasswordResetService {
    String requestOtp(ForgotPasswordRequestDTO request);
    String resetPassword(ResetPasswordRequestDTO request);
}