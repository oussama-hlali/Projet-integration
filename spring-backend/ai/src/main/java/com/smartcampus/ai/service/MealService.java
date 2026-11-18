package com.smartcampus.ai.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MealService {
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> safeMeals(List<Map<String, Object>> items, List<String> allergens) {
        if (items == null) return List.of();
        List<String> a = allergens == null ? List.of() : allergens.stream().map(String::toLowerCase).toList();
        return items.stream().filter(it -> {
            Object al = it.get("allergens");
            List<String> itemAllergens = al instanceof List ? (List<String>) al : List.of();
            return itemAllergens.stream().map(String::toLowerCase).noneMatch(a::contains);
        }).collect(Collectors.toList());
    }
}
