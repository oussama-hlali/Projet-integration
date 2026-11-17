package com.smartcampus.cafeteria.controller;

import com.smartcampus.cafeteria.repository.CafeteriaMenuRepository;
import com.smartcampus.cafeteria.repository.CafeteriaOrderRepository;
import com.smartcampus.cafeteria.repository.MenuItemRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class KpiController {
    private final CafeteriaMenuRepository menus;
    private final MenuItemRepository items;
    private final CafeteriaOrderRepository orders;

    public KpiController(CafeteriaMenuRepository menus, MenuItemRepository items, CafeteriaOrderRepository orders) {
        this.menus = menus; this.items = items; this.orders = orders;
    }

    @GetMapping("/cafeteria/kpi")
    public Map<String, Object> kpi() {
        long totalOrders = orders.count();
        long cancelled = orders.findAll().stream().filter(o -> "CANCELLED".equals(o.getStatus())).count();
        return Map.of(
                "menusTotal", menus.count(),
                "itemsTotal", items.count(),
                "ordersTotal", totalOrders,
                "ordersCancelled", cancelled,
                "ordersActive", totalOrders - cancelled
        );
    }
}
