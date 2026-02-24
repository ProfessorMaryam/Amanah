package com.amanah.repository;

import com.amanah.entity.Child;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChildRepository extends JpaRepository<Child, UUID> {
    List<Child> findAllByParentId(UUID parentId);
    Optional<Child> findByIdAndParentId(UUID id, UUID parentId);
}
