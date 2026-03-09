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

    @Query("SELECT go FROM GoalOwner go WHERE go.childId = :childId ORDER BY go.goalId")
    List<GoalOwner> findAllByChildId(@Param("childId") UUID childId);
}
