package com.smartcampus.cafeteria.repository;

import com.smartcampus.cafeteria.domain.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, String> {
    List<MenuItem> findByMenuId(String menuId);
}
