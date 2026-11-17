package com.smartcampus.cafeteria.repository;

import com.smartcampus.cafeteria.domain.CafeteriaMenu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CafeteriaMenuRepository extends JpaRepository<CafeteriaMenu, String> {
    List<CafeteriaMenu> findByDateBetweenOrderByDateAsc(Instant from, Instant to);
    Optional<CafeteriaMenu> findFirstByDateGreaterThanEqualOrderByDateAsc(Instant from);
}
