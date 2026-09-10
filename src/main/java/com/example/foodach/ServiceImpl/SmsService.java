package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.SmsRequest;
import com.example.foodach.DTO.SmsResponse;
import com.example.foodach.Entity.SmsMessage;
import com.example.foodach.Repository.SmsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SmsService {

    private final SmsRepository smsRepository;

    @Value("${sms.gateway.url:}")
    private String gatewayUrl;

    @Value("${sms.gateway.api-key:}")
    private String gatewayApiKey;

    public SmsResponse send(SmsRequest request) {
        if (request.toPhone() == null || request.toPhone().isBlank()) {
            throw new IllegalArgumentException("Phone number is required");
        }
        if (request.body() == null || request.body().isBlank()) {
            throw new IllegalArgumentException("Message is required");
        }

        String toPhone = normalizePhone(request.toPhone().trim());
        String provider = gatewayUrl.isBlank() ? "Simulated gateway" : "SMS gateway";
        String status;

        if (gatewayUrl.isBlank()) {
            log.info("[SMS SIMULATED] To {}: {}", toPhone, request.body());
            status = "Simulated";
        } else {
            try {
                RestClient client = RestClient.builder().baseUrl(gatewayUrl).build();
                client.post()
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(gatewayApiKey.isBlank() ? "Authorization" : "Authorization", gatewayApiKey.isBlank() ? "" : "Bearer " + gatewayApiKey)
                        .body(Map.of(
                                "to", toPhone,
                                "from", request.fromName() == null ? "" : request.fromName(),
                                "message", request.body()
                        ))
                        .retrieve()
                        .toBodilessEntity();
                status = "Sent";
            } catch (Exception e) {
                log.error("SMS gateway failed", e);
                throw new RuntimeException("SMS gateway failed: " + e.getMessage());
            }
        }

        SmsMessage sms = new SmsMessage();
        sms.setFromName(trimToNull(request.fromName()));
        sms.setToName(trimToNull(request.toName()));
        sms.setToPhone(toPhone);
        sms.setBody(request.body().trim());
        sms.setStatus(status);
        sms.setProvider(provider);

        return mapToResponseDTO(smsRepository.save(sms));
    }

    private String normalizePhone(String raw) {
        String digits = raw.replaceAll("[^\\d+]", "");
        if (digits.startsWith("+")) {
            return digits;
        }
        if (digits.startsWith("0") && digits.length() == 10) {
            return "+255" + digits.substring(1);
        }
        if (digits.length() == 9) {
            return "+255" + digits;
        }
        return raw;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private SmsResponse mapToResponseDTO(SmsMessage sms) {
        return new SmsResponse(
                sms.getId(),
                sms.getFromName(),
                sms.getToName(),
                sms.getToPhone(),
                sms.getBody(),
                sms.getStatus(),
                sms.getProvider(),
                sms.getCreatedAt()
        );
    }
}