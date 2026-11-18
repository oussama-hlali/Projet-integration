package com.smartcampus.ai.controller;

import com.smartcampus.ai.service.MealService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class MealController {
    private final MealService service;
    public MealController(MealService service) { this.service = service; }

    @PostMapping("/meals/safe")
    public List<Map<String, Object>> safe(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
        @SuppressWarnings("unchecked")
        List<String> allergens = (List<String>) body.get("allergens");
        return service.safeMeals(items, allergens);
    }
}
