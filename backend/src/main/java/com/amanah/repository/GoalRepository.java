package com.amanah.repository;

import com.amanah.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GoalRepository extends JpaRepository<Goal, UUID> {
    Optional<Goal> findByChildId(UUID childId);
    Optional<Goal> findByStripeSubscriptionId(String stripeSubscriptionId);
    void deleteByChildId(UUID childId);
}
