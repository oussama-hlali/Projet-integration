package com.smartcampus.identity.repository;

import com.smartcampus.identity.domain.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
}
