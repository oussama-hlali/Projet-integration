package com.smartcampus.cafeteria.service;

import com.smartcampus.cafeteria.domain.CafeteriaMenu;
import com.smartcampus.cafeteria.domain.CafeteriaOrder;
import com.smartcampus.cafeteria.domain.MenuItem;
import com.smartcampus.cafeteria.repository.CafeteriaMenuRepository;
import com.smartcampus.cafeteria.repository.CafeteriaOrderRepository;
import com.smartcampus.cafeteria.repository.MenuItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {
    private final CafeteriaOrderRepository orders;
    private final CafeteriaMenuRepository menus;
    private final MenuItemRepository items;

    public OrderService(CafeteriaOrderRepository orders, CafeteriaMenuRepository menus, MenuItemRepository items) {
        this.orders = orders; this.menus = menus; this.items = items;
    }

    @Transactional
    public CafeteriaOrder reserve(String menuId, String itemId, String userId, String idempotencyKey) {
        // idempotency: return existing order for this key
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var existing = orders.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) return existing.get();
        }

        // uniqueness: one reservation per user per dish
        if (orders.existsByUserIdAndMenuIdAndItemId(userId, menuId, itemId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ALREADY_RESERVED");
        }

        CafeteriaMenu menu = menus.findById(menuId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu not found"));
        MenuItem item = items.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));

        CafeteriaOrder o = new CafeteriaOrder();
        o.setId("o" + UUID.randomUUID().toString().substring(0, 8));
        o.setReference("CAF-" + (1000 + (int) (Math.random() * 9000)));
        o.setUserId(userId);
        o.setMenuId(menuId);
        o.setItemId(itemId);
        o.setItemName(item.getName());
        o.setMenuLabel(menu.getMeal());
        o.setBuilding(menu.getBuilding());
        o.setDate(menu.getDate());
        o.setPickupTime(menu.getOpeningHours());
        o.setPrice(item.getPrice());
        o.setQrPayload("CAF:" + userId + ":" + itemId + ":" + menuId);
        o.setIdempotencyKey(idempotencyKey);
        try {
            return orders.save(o);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // race: another request won
            return orders.findByUserIdAndMenuIdAndItemId(userId, menuId, itemId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "ALREADY_RESERVED"));
        }
    }

    public CafeteriaOrder get(String id) {
        return orders.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    public List<CafeteriaOrder> forUser(String userId) { return orders.findByUserIdOrderByCreatedAtDesc(userId); }

    public CafeteriaOrder latestFor(String userId) { return orders.findFirstByUserIdOrderByCreatedAtDesc(userId).orElse(null); }

    public boolean hasReserved(String menuId, String itemId, String userId) {
        return orders.existsByUserIdAndMenuIdAndItemId(userId, menuId, itemId);
    }

    @Transactional
    public boolean cancel(String orderId, String userId) {
        CafeteriaOrder o = orders.findById(orderId).orElse(null);
        if (o == null || !o.getUserId().equals(userId)) return false;
        if ("CANCELLED".equals(o.getStatus())) return false;
        o.setStatus("CANCELLED");
        orders.save(o);
        return true;
    }
}
