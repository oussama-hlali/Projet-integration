package com.smartcampus.engagement.repository;

import com.smartcampus.engagement.domain.LostFoundItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface LostFoundRepository extends JpaRepository<LostFoundItem, String>, JpaSpecificationExecutor<LostFoundItem> {
}
