package com.example.foodach.Service;

import com.example.foodach.DTO.TechnicalSupportRequest;
import com.example.foodach.DTO.TechnicalSupportResponse;

import java.util.List;

public interface TechnicalSupportService {
    List<TechnicalSupportResponse> getAll();
    TechnicalSupportResponse add(TechnicalSupportRequest request);
    TechnicalSupportResponse update(Long id, TechnicalSupportRequest request);
    void delete(Long id, String role, String userId);
}