package com.amanah.repository;

import com.amanah.entity.PersonalGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PersonalGoalRepository extends JpaRepository<PersonalGoal, UUID> {
    List<PersonalGoal> findByUserId(UUID userId);
    Optional<PersonalGoal> findByIdAndUserId(UUID id, UUID userId);
}
