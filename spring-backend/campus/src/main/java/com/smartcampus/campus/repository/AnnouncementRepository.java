package com.smartcampus.campus.repository;

import com.smartcampus.campus.domain.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, String> {
    List<Announcement> findAllByOrderByPinnedDescCreatedAtDesc();
}
