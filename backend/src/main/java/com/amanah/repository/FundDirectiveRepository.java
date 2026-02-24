package com.amanah.repository;

import com.amanah.entity.FundDirective;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FundDirectiveRepository extends JpaRepository<FundDirective, UUID> {
    Optional<FundDirective> findByChildId(UUID childId);
}
