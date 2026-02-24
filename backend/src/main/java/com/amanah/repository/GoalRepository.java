package com.amanah.repository;

import com.amanah.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoalRepository extends JpaRepository<Goal, UUID> {
    Optional<Goal> findByChildId(UUID childId);
    List<Goal> findAllByChildIdInAndPausedFalse(List<UUID> childIds);
}
