package com.smartcampus.cafeteria.config;

import com.smartcampus.cafeteria.domain.CafeteriaMenu;
import com.smartcampus.cafeteria.domain.MenuItem;
import com.smartcampus.cafeteria.repository.CafeteriaMenuRepository;
import com.smartcampus.cafeteria.repository.MenuItemRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Configuration
@Profile("dev")
public class DevDataSeeder {

    @Bean
    CommandLineRunner seedMenus(CafeteriaMenuRepository menus, MenuItemRepository items) {
        return args -> {
            if (menus.count() > 0) return;
            String[] days = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday"};
            String[] buildings = {"Main Building", "Science Block", "Engineering Wing", "Library Cafe", "Student Center"};
            for (int i = 0; i < 5; i++) {
                Instant date = ZonedDateTime.now(ZoneOffset.UTC).withHour(12).withMinute(0).withSecond(0).toInstant()
                        .plusSeconds((i - 2) * 86400L);
                CafeteriaMenu m = new CafeteriaMenu();
                m.setId("m" + (i + 1));
                m.setBuildingId("b" + (i + 1));
                m.setBuilding(buildings[i]);
                m.setDate(date);
                m.setMeal("Lunch");
                m.setOpeningHours("11:30 - 14:00");
                menus.save(m);

                addItem(items, m.getId(), "Grilled Chicken", "With rice and salad", 8.5, "Sans gluten", "");
                addItem(items, m.getId(), "Pasta Primavera", "Vegetarian pasta", 7.0, "Végétarien", "Gluten");
                addItem(items, m.getId(), "Vegan Bowl", "Quinoa and veggies", 9.0, "Vegan", "");
            }
        };
    }

    private void addItem(MenuItemRepository items, String menuId, String name, String desc, double price,
                         String dietary, String allergens) {
        MenuItem i = new MenuItem();
        i.setId("mi" + UUID.randomUUID().toString().substring(0, 8));
        i.setMenuId(menuId);
        i.setName(name);
        i.setDescription(desc);
        i.setPrice(price);
        i.setDietaryLabelsCsv(dietary);
        i.setAllergensCsv(allergens);
        items.save(i);
    }
}
