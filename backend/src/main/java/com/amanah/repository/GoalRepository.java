package com.amanah.repository;

import com.amanah.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * In the new schema goals no longer carry child_id directly.
 * Child-to-goal lookups go through goal_owners — see GoalOwnerRepository.
 */
public interface GoalRepository extends JpaRepository<Goal, UUID> {

    /** Find all non-paused goals by their IDs (used for dashboard aggregation). */
    List<Goal> findAllByIdInAndIsPausedFalse(List<UUID> goalIds);
}
