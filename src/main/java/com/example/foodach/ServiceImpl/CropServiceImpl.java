package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.CropRequestDTO;
import com.example.foodach.DTO.CropResponseDTO;
import com.example.foodach.Entity.Crops;
import com.example.foodach.Repository.CropsRepository;
import com.example.foodach.Service.CropsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CropServiceImpl implements CropsService {
    private final CropsRepository cropsRepository;

    @Override
    public CropResponseDTO addCrop(CropRequestDTO requestDTO) {
        Crops crop = new Crops();
        crop.setName(requestDTO.name());
        crop.setCategory(requestDTO.category());
        crop.setDescription(requestDTO.description());

        Crops savedCrop = cropsRepository.save(crop);
        return mapToResponseDTO(savedCrop);
    }

    @Override
    public CropResponseDTO getCropById(Long id) {
        Crops crop = cropsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Crop not found"));
        return mapToResponseDTO(crop);
    }

    @Override
    public List<CropResponseDTO> getAllCrops() {
        return cropsRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CropResponseDTO getCropByName(String name) {
        Crops crop = cropsRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new RuntimeException("Crop not found"));
        return mapToResponseDTO(crop);
    }

    private CropResponseDTO mapToResponseDTO(Crops crop) {
        return new CropResponseDTO(
                crop.getId(),
                crop.getName(),
                crop.getDescription(),
                crop.getCategory(),
                List.of()
        );
    }
}
