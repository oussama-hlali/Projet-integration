package com.smartcampus.cafeteria.controller;

import com.smartcampus.cafeteria.domain.CafeteriaMenu;
import com.smartcampus.cafeteria.domain.MenuItem;
import com.smartcampus.cafeteria.service.MenuService;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class MenuController {
    private final MenuService service;
    public MenuController(MenuService service) { this.service = service; }

    @GetMapping("/menus")
    public List<CafeteriaMenu> list() { return service.list(); }

    @GetMapping("/menus/{id}")
    public CafeteriaMenu get(@PathVariable String id) { return service.get(id); }

    @GetMapping("/menus/today")
    public CafeteriaMenu today() { return service.today(); }

    @GetMapping("/menus/by-date")
    public CafeteriaMenu byDate(@RequestParam String date) { return service.forDate(Instant.parse(date)); }

    @PostMapping("/menus")
    public CafeteriaMenu create(@RequestBody Map<String, Object> body) {
        return service.create(
                (String) body.get("buildingId"),
                (String) body.get("building"),
                Instant.parse((String) body.get("date")),
                (String) body.get("meal"),
                (String) body.get("openingHours"));
    }

    @PutMapping("/menus/{id}")
    public CafeteriaMenu update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return service.update(
                id,
                (String) body.get("building"),
                body.get("date") == null ? null : Instant.parse((String) body.get("date")),
                (String) body.get("meal"),
                (String) body.get("openingHours"));
    }

    @DeleteMapping("/menus/{id}")
    public void delete(@PathVariable String id) { service.delete(id); }

    @GetMapping("/menus/{id}/items")
    public List<MenuItem> items(@PathVariable String id) { return service.items(id); }

    @PostMapping("/menus/{id}/items")
    public MenuItem addItem(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return service.addItem(
                id,
                (String) body.get("name"),
                (String) body.get("description"),
                ((Number) body.getOrDefault("price", 0)).doubleValue(),
                (String) body.get("dietaryLabelsCsv"),
                (String) body.get("allergensCsv"));
    }

    @PutMapping("/menu-items/{itemId}")
    public MenuItem updateItem(@PathVariable String itemId, @RequestBody Map<String, Object> body) {
        return service.updateItem(
                itemId,
                (String) body.get("name"),
                (String) body.get("description"),
                body.get("price") == null ? null : ((Number) body.get("price")).doubleValue(),
                (String) body.get("dietaryLabelsCsv"),
                (String) body.get("allergensCsv"));
    }

    @DeleteMapping("/menu-items/{itemId}")
    public void deleteItem(@PathVariable String itemId) { service.deleteItem(itemId); }
}
