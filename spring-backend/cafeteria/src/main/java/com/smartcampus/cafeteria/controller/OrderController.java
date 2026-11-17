package com.smartcampus.cafeteria.controller;

import com.smartcampus.cafeteria.domain.CafeteriaOrder;
import com.smartcampus.cafeteria.service.OrderService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class OrderController {
    private final OrderService service;
    public OrderController(OrderService service) { this.service = service; }

    @GetMapping("/orders")
    public List<CafeteriaOrder> list(@RequestParam(required = false) String userId) {
        if (userId != null) return service.forUser(userId);
        return List.of();
    }

    @GetMapping("/orders/{id}")
    public CafeteriaOrder get(@PathVariable String id) { return service.get(id); }

    @GetMapping("/orders/latest")
    public CafeteriaOrder latest(@RequestParam String userId) { return service.latestFor(userId); }

    @PostMapping("/orders")
    public CafeteriaOrder reserve(@RequestBody Map<String, Object> body,
                                 @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        String key = idempotencyKey != null ? idempotencyKey : (String) body.get("idempotencyKey");
        return service.reserve(
                (String) body.get("menuId"),
                (String) body.get("itemId"),
                (String) body.get("userId"),
                key);
    }

    @PostMapping("/orders/{id}/cancel")
    public Map<String, Object> cancel(@PathVariable String id, @RequestParam String userId) {
        boolean ok = service.cancel(id, userId);
        return Map.of("cancelled", ok);
    }

    @GetMapping("/orders/has-reserved")
    public Map<String, Object> hasReserved(@RequestParam String menuId,
                                           @RequestParam String itemId,
                                           @RequestParam String userId) {
        return Map.of("reserved", service.hasReserved(menuId, itemId, userId));
    }
}
