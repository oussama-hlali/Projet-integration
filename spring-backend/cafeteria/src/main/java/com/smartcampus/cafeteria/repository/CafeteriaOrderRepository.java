package com.smartcampus.cafeteria.repository;

import com.smartcampus.cafeteria.domain.CafeteriaOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CafeteriaOrderRepository extends JpaRepository<CafeteriaOrder, String> {
    List<CafeteriaOrder> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<CafeteriaOrder> findByIdempotencyKey(String key);
    Optional<CafeteriaOrder> findFirstByUserIdOrderByCreatedAtDesc(String userId);
    boolean existsByUserIdAndMenuIdAndItemId(String userId, String menuId, String itemId);
    Optional<CafeteriaOrder> findByUserIdAndMenuIdAndItemId(String userId, String menuId, String itemId);
}
