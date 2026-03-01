package com.amanah.repository;

import com.amanah.entity.GoalOwner;
import com.amanah.entity.GoalOwnerPK;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoalOwnerRepository extends JpaRepository<GoalOwner, GoalOwnerPK> {

    /** Find all goal_owners rows for a given child. */
    List<GoalOwner> findAllByChildId(UUID childId);

    /** Find the single goal_owner row linking a goal to a child (child has at most one goal). */
    Optional<GoalOwner> findByChildId(UUID childId);

    /** Find the goal_owner row for a specific goal + child combination. */
    Optional<GoalOwner> findByGoalIdAndChildId(UUID goalId, UUID childId);

    /** Find the goal_owner row for a given owner (used when the owner is a child user). */
    Optional<GoalOwner> findByOwnerId(UUID ownerId);

    /** Find all goal_ids owned by a given user. */
    @Query("SELECT go.goalId FROM GoalOwner go WHERE go.ownerId = :ownerId")
    List<UUID> findGoalIdsByOwnerId(UUID ownerId);

    /** Find all goal_ids for children belonging to a parent (via owner). */
    @Query("SELECT go.goalId FROM GoalOwner go WHERE go.childId IN :childIds")
    List<UUID> findGoalIdsByChildIdIn(List<UUID> childIds);

    /** Find all goal_owner rows for a list of children (used by simulation). */
    List<GoalOwner> findAllByChildIdIn(List<UUID> childIds);
}
