package com.smartcampus.cafeteria.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "menu_items", schema = "cafeteria")
public class MenuItem {
    @Id
    @Column(length = 64)
    private String id;
    @Column(name = "menu_id", length = 64, nullable = false)
    private String menuId;
    @Column(length = 120, nullable = false)
    private String name;
    @Column(length = 500)
    private String description;
    @Column(nullable = false)
    private double price;
    @Column(name = "dietary_labels", length = 200)
    private String dietaryLabelsCsv = "";
    @Column(name = "allergens", length = 200)
    private String allergensCsv = "";

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getMenuId() { return menuId; }
    public void setMenuId(String menuId) { this.menuId = menuId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    public String getDietaryLabelsCsv() { return dietaryLabelsCsv; }
    public void setDietaryLabelsCsv(String v) { this.dietaryLabelsCsv = v == null ? "" : v; }
    public String getAllergensCsv() { return allergensCsv; }
    public void setAllergensCsv(String v) { this.allergensCsv = v == null ? "" : v; }

    public java.util.List<String> dietaryLabels() {
        return dietaryLabelsCsv.isBlank() ? java.util.List.of() : java.util.Arrays.asList(dietaryLabelsCsv.split(","));
    }
    public java.util.List<String> allergens() {
        return allergensCsv.isBlank() ? java.util.List.of() : java.util.Arrays.asList(allergensCsv.split(","));
    }
}
