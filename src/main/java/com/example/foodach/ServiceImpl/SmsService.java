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
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class SmsService {

    private static final String DEFAULT_GATEWAY_URL = "https://api.africastalking.com/version1/messaging";

    private static final Pattern BALANCE_PATTERN = Pattern.compile("([A-Za-z]{3})\\s*([0-9]+(?:\\.[0-9]+)?)");

    private final SmsRepository smsRepository;

    @Value("${sms.gateway.url:" + DEFAULT_GATEWAY_URL + "}")
    private String gatewayUrl;

    @Value("${sms.gateway.api-key:}")
    private String gatewayApiKey;

    @Value("${sms.gateway.username:}")
    private String gatewayUsername;

    @Value("${sms.gateway.from:}")
    private String senderId;

    public SmsResponse send(SmsRequest request) {
        if (request.toPhone() == null || request.toPhone().isBlank()) {
            throw new IllegalArgumentException("Phone number is required");
        }
        if (request.body() == null || request.body().isBlank()) {
            throw new IllegalArgumentException("Message is required");
        }

        String toPhone = normalizePhone(request.toPhone().trim());
        boolean simulated = gatewayApiKey == null || gatewayApiKey.isBlank();
        String provider = simulated ? "Simulated gateway" : "Africa's Talking";
        String status;

        if (simulated) {
            log.info("[SMS SIMULATED] To {}: {}", toPhone, request.body());
            status = "Simulated";
        } else {
            try {
                RestClient client = RestClient.builder().baseUrl(gatewayUrl).build();
                LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
                form.add("username", gatewayUsername);
                form.add("to", toPhone);
                form.add("message", request.body().trim());
                if (senderId != null && !senderId.isBlank()) {
                    form.add("from", senderId.trim());
                }
                client.post()
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .accept(MediaType.APPLICATION_JSON)
                        .header("apiKey", gatewayApiKey)
                        .body(form)
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

    public Map<String, Object> getBalance() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("provider", gatewayApiKey == null || gatewayApiKey.isBlank() ? null : "Africa's Talking");
        result.put("simulated", gatewayApiKey == null || gatewayApiKey.isBlank());
        result.put("balance", null);
        result.put("currency", null);
        result.put("units", null);

        if (result.get("simulated").equals(Boolean.TRUE)) {
            return result;
        }

        try {
            String uri = UriComponentsBuilder.fromUriString("https://api.africastalking.com/user")
                    .queryParam("username", gatewayUsername)
                    .build()
                    .toUriString();
            String body = RestClient.builder().baseUrl(gatewayUrl).build()
                    .get()
                    .uri(uri)
                    .header("apiKey", gatewayApiKey)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(String.class);

            Matcher m = BALANCE_PATTERN.matcher(body == null ? "" : body);
            if (m.find()) {
                result.put("currency", m.group(1).toUpperCase());
                result.put("balance", Double.parseDouble(m.group(2)));
            }
        } catch (Exception e) {
            log.warn("Could not fetch Africa's Talking balance: {}", e.getMessage());
        }
        return result;
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