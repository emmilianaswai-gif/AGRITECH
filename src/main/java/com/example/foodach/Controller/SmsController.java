package com.example.foodach.Controller;

import com.example.foodach.DTO.SmsRequest;
import com.example.foodach.DTO.SmsResponse;
import com.example.foodach.ServiceImpl.SmsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/sms")
@RequiredArgsConstructor
public class SmsController {

    private final SmsService smsService;

    @PostMapping("/send")
    public ResponseEntity<SmsResponse> send(@RequestBody SmsRequest request) {
        return ResponseEntity.ok(smsService.send(request));
    }

    @GetMapping("/balance")
    public ResponseEntity<Map<String, Object>> balance() {
        return ResponseEntity.ok(smsService.getBalance());
    }
}