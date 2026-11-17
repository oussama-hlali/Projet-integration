package com.smartcampus.engagement.repository;

import com.smartcampus.engagement.domain.LostFoundItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LostFoundRepository extends JpaRepository<LostFoundItem, String> {
    @Query("SELECT l FROM LostFoundItem l WHERE " +
           "(:status IS NULL OR l.status = :status) AND " +
           "(:q IS NULL OR LOWER(l.title) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<LostFoundItem> search(@Param("status") String status, @Param("q") String q);
}
