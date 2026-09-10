package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.ForgotPasswordRequestDTO;
import com.example.foodach.DTO.ResetPasswordRequestDTO;
import com.example.foodach.Entity.PasswordResetOtp;
import com.example.foodach.Entity.User;
import com.example.foodach.Repository.PasswordResetOtpRepository;
import com.example.foodach.Repository.UserRepository;
import com.example.foodach.Service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

    private final PasswordResetOtpRepository otpRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.mail.from:}")
    private String mailFrom;

    private static final long OTP_TTL_MINUTES = 10;

    @Override
    @Transactional
    public String requestOtp(ForgotPasswordRequestDTO request) {
        String identifier = request.identifier();
        if (identifier == null || identifier.isBlank())
            throw new RuntimeException("Email or phone number is required");

        List<User> users = findUsersByIdentifier(identifier);
        if (users.isEmpty())
            throw new RuntimeException("Account not found");

        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));

        otpRepository.deleteByIdentifierIgnoreCase(identifier);

        PasswordResetOtp otp = new PasswordResetOtp();
        otp.setIdentifier(identifier);
        otp.setCode(code);
        otp.setExpiresAt(Instant.now().plus(OTP_TTL_MINUTES, ChronoUnit.MINUTES));
        otp.setCreatedAt(Instant.now());
        otp.setUsed(false);
        otpRepository.save(otp);

        if (mailUsername == null || mailUsername.isBlank()) {
            System.out.println("[PASSWORD-RESET] SMTP not configured. OTP for " + identifier + " is " + code);
        } else {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(mailFrom.isBlank() ? mailUsername : mailFrom);
                message.setTo(emailOf(users));
                message.setSubject("AgriTech password reset code");
                message.setText("Your AgriTech password reset code is " + code
                        + ". It expires in " + OTP_TTL_MINUTES + " minutes.");
                mailSender.send(message);
            } catch (Exception e) {
                System.out.println("[PASSWORD-RESET] Failed to send email to " + identifier + ": " + e.getMessage());
                System.out.println("[PASSWORD-RESET] OTP for " + identifier + " is " + code);
            }
        }

        return "A password reset code has been sent.";
    }

    @Override
    @Transactional
    public String resetPassword(ResetPasswordRequestDTO request) {
        String identifier = request.identifier();
        if (identifier == null || identifier.isBlank())
            throw new RuntimeException("Email or phone number is required");
        if (request.newPassword() == null || request.newPassword().isBlank())
            throw new RuntimeException("New password is required");

        List<PasswordResetOtp> otps = otpRepository
                .findAllByIdentifierIgnoreCaseAndCodeAndUsedFalse(identifier, request.code());
        PasswordResetOtp otp = otps.stream()
                .max(Comparator.comparing(PasswordResetOtp::getCreatedAt))
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset code"));

        if (otp.getExpiresAt().isBefore(Instant.now()))
            throw new RuntimeException("Reset code has expired. Request a new one.");

        List<User> users = findUsersByIdentifier(identifier);
        if (users.isEmpty())
            throw new RuntimeException("Account not found");

        for (User user : users) {
            user.setPassword(request.newPassword());
            userRepository.save(user);
        }

        otp.setUsed(true);
        otp.setUsedAt(Instant.now());
        otpRepository.save(otp);
        otpRepository.deleteByIdentifierIgnoreCase(identifier);

        return "Password updated successfully. You can now log in.";
    }

    private List<User> findUsersByIdentifier(String identifier) {
        List<User> byEmail = userRepository.findAllByEmailIgnoreCase(identifier);
        if (!byEmail.isEmpty())
            return byEmail;
        return userRepository.findByPhoneNumber(identifier).stream().toList();
    }

    private String[] emailOf(List<User> users) {
        return users.stream()
                .map(User::getEmail)
                .filter(e -> e != null && !e.isBlank())
                .toArray(String[]::new);
    }
}