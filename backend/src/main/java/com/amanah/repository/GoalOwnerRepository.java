package com.amanah.repository;

import com.amanah.entity.GoalOwner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoalOwnerRepository extends JpaRepository<GoalOwner, GoalOwner.GoalOwnerId> {
    Optional<GoalOwner> findByChildId(UUID childId);
    List<GoalOwner> findAllByChildIdIn(List<UUID> childIds);
    void deleteAllByChildId(UUID childId);

    @Query("SELECT go FROM GoalOwner go WHERE go.childId = :childId ORDER BY go.goalId")
    List<GoalOwner> findAllByChildId(@Param("childId") UUID childId);

    // Personal goals owned by a user (child user's own goals — no saving-pot childId)
    @Query("SELECT go FROM GoalOwner go WHERE go.ownerId = :ownerId AND go.childId IS NULL")
    List<GoalOwner> findAllByOwnerIdAndChildIdIsNull(@Param("ownerId") UUID ownerId);

    @Query("SELECT go FROM GoalOwner go WHERE go.ownerId = :ownerId AND go.goalId = :goalId AND go.childId IS NULL")
    Optional<GoalOwner> findByOwnerIdAndGoalIdAndChildIdIsNull(@Param("ownerId") UUID ownerId, @Param("goalId") UUID goalId);
}
