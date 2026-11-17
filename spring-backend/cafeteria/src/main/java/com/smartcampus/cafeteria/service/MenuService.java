package com.smartcampus.cafeteria.service;

import com.smartcampus.cafeteria.domain.CafeteriaMenu;
import com.smartcampus.cafeteria.domain.MenuItem;
import com.smartcampus.cafeteria.repository.CafeteriaMenuRepository;
import com.smartcampus.cafeteria.repository.MenuItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class MenuService {
    private final CafeteriaMenuRepository menus;
    private final MenuItemRepository items;

    public MenuService(CafeteriaMenuRepository menus, MenuItemRepository items) {
        this.menus = menus; this.items = items;
    }

    public List<CafeteriaMenu> list() { return menus.findAll(); }
    public CafeteriaMenu get(String id) { return menus.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu not found")); }

    public CafeteriaMenu create(String buildingId, String building, Instant date, String meal, String openingHours) {
        CafeteriaMenu m = new CafeteriaMenu();
        m.setId("m" + UUID.randomUUID().toString().substring(0, 8));
        m.setBuildingId(buildingId);
        m.setBuilding(building);
        m.setDate(date);
        m.setMeal(meal == null ? "Lunch" : meal);
        m.setOpeningHours(openingHours);
        return menus.save(m);
    }

    public CafeteriaMenu update(String id, String building, Instant date, String meal, String openingHours) {
        CafeteriaMenu m = get(id);
        if (building != null) m.setBuilding(building);
        if (date != null) m.setDate(date);
        if (meal != null) m.setMeal(meal);
        if (openingHours != null) m.setOpeningHours(openingHours);
        return menus.save(m);
    }

    public void delete(String id) { menus.deleteById(id); }

    public List<MenuItem> items(String menuId) { return items.findByMenuId(menuId); }

    public MenuItem addItem(String menuId, String name, String description, double price,
                            String dietaryLabelsCsv, String allergensCsv) {
        MenuItem i = new MenuItem();
        i.setId("mi" + UUID.randomUUID().toString().substring(0, 8));
        i.setMenuId(menuId);
        i.setName(name);
        i.setDescription(description);
        i.setPrice(price);
        i.setDietaryLabelsCsv(dietaryLabelsCsv);
        i.setAllergensCsv(allergensCsv);
        return items.save(i);
    }

    public MenuItem updateItem(String itemId, String name, String description, Double price,
                               String dietaryLabelsCsv, String allergensCsv) {
        MenuItem i = items.findById(itemId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        if (name != null) i.setName(name);
        if (description != null) i.setDescription(description);
        if (price != null) i.setPrice(price);
        if (dietaryLabelsCsv != null) i.setDietaryLabelsCsv(dietaryLabelsCsv);
        if (allergensCsv != null) i.setAllergensCsv(allergensCsv);
        return items.save(i);
    }

    public void deleteItem(String itemId) { items.deleteById(itemId); }

    public CafeteriaMenu today() {
        Instant now = Instant.now();
        return menus.findFirstByDateGreaterThanEqualOrderByDateAsc(now).orElse(null);
    }

    public CafeteriaMenu forDate(Instant date) {
        return menus.findByDateBetweenOrderByDateAsc(date, date).stream().findFirst().orElse(null);
    }
}
