package com.amanah.service;

import com.amanah.entity.Child;
import com.amanah.repository.ChildRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChildService {

    private final ChildRepository childRepository;

    public List<Child> getChildren(UUID parentId) {
        return childRepository.findAllByParentId(parentId);
    }

    public Child getChild(UUID id, UUID parentId) {
        return childRepository.findByIdAndParentId(id, parentId)
                .orElseThrow(() -> new RuntimeException("Child not found"));
    }

    public Child addChild(UUID parentId, String name, java.time.LocalDate dob, String photoUrl) {
        Child child = Child.builder()
                .parentId(parentId)
                .name(name)
                .dateOfBirth(dob)
                .photoUrl(photoUrl)
                .build();
        return childRepository.save(child);
    }

    public Child updateChild(UUID id, UUID parentId, String name, java.time.LocalDate dob, String photoUrl) {
        Child child = getChild(id, parentId);
        child.setName(name);
        child.setDateOfBirth(dob);
        child.setPhotoUrl(photoUrl);
        return childRepository.save(child);
    }

    public void deleteChild(UUID id, UUID parentId) {
        Child child = getChild(id, parentId);
        childRepository.delete(child);
    }
}
