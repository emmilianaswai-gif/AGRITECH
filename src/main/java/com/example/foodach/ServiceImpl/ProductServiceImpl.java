package com.example.foodach.ServiceImpl;

import com.example.foodach.Repository.ProductRepository;
import com.example.foodach.Service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;




}
