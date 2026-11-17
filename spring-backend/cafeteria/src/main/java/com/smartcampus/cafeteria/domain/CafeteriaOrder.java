package com.smartcampus.cafeteria.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(name = "orders", schema = "cafeteria",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "menu_id", "item_id"}))
public class CafeteriaOrder {
    @Id
    @Column(length = 64)
    private String id;
    @Column(length = 32, nullable = false, unique = true)
    private String reference;
    @Column(name = "user_id", length = 64, nullable = false)
    private String userId;
    @Column(name = "menu_id", length = 64, nullable = false)
    private String menuId;
    @Column(name = "item_id", length = 64, nullable = false)
    private String itemId;
    @Column(name = "item_name", length = 120, nullable = false)
    private String itemName;
    @Column(name = "menu_label", length = 120)
    private String menuLabel;
    @Column(length = 120)
    private String building;
    @Column(nullable = false)
    private Instant date;
    @Column(name = "pickup_time", length = 32)
    private String pickupTime;
    @Column(nullable = false)
    private double price;
    @Column(length = 16, nullable = false)
    private String status = "CONFIRMED";
    @Column(name = "qr_payload", length = 200, nullable = false)
    private String qrPayload;
    @Column(name = "idempotency_key", length = 64, unique = true)
    private String idempotencyKey;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getMenuId() { return menuId; }
    public void setMenuId(String menuId) { this.menuId = menuId; }
    public String getItemId() { return itemId; }
    public void setItemId(String itemId) { this.itemId = itemId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getMenuLabel() { return menuLabel; }
    public void setMenuLabel(String menuLabel) { this.menuLabel = menuLabel; }
    public String getBuilding() { return building; }
    public void setBuilding(String building) { this.building = building; }
    public Instant getDate() { return date; }
    public void setDate(Instant date) { this.date = date; }
    public String getPickupTime() { return pickupTime; }
    public void setPickupTime(String pickupTime) { this.pickupTime = pickupTime; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getQrPayload() { return qrPayload; }
    public void setQrPayload(String qrPayload) { this.qrPayload = qrPayload; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public Instant getCreatedAt() { return createdAt; }
}
