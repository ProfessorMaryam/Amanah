package com.amanah.service;

import com.amanah.entity.Child;
import com.amanah.repository.ChildRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChildService {

    private static final Logger log = LoggerFactory.getLogger(ChildService.class);

    private final ChildRepository childRepository;

    public List<Child> getChildren(UUID parentId) {
        log.debug("[ChildService] getChildren parentId={}", parentId);
        return childRepository.findAllByParentId(parentId);
    }

    public Child getChild(UUID id, UUID parentId) {
        log.debug("[ChildService] getChild id={} parentId={}", id, parentId);
        return childRepository.findByIdAndParentId(id, parentId)
                .orElseThrow(() -> {
                    log.warn("[ChildService] Child not found id={} parentId={}", id, parentId);
                    return new RuntimeException("Child not found");
                });
    }

    public Child addChild(UUID parentId, String name, java.time.LocalDate dob, String photoUrl) {
        log.info("[ChildService] addChild parentId={} name={} dob={}", parentId, name, dob);
        Child child = Child.builder()
                .parentId(parentId)
                .name(name)
                .dateOfBirth(dob)
                .photoUrl(photoUrl)
                .build();
        Child saved = childRepository.save(child);
        log.info("[ChildService] Child created id={}", saved.getId());
        return saved;
    }

    public Child updateChild(UUID id, UUID parentId, String name, java.time.LocalDate dob, String photoUrl) {
        log.info("[ChildService] updateChild id={} parentId={} name={}", id, parentId, name);
        Child child = getChild(id, parentId);
        child.setName(name);
        child.setDateOfBirth(dob);
        child.setPhotoUrl(photoUrl);
        Child saved = childRepository.save(child);
        log.info("[ChildService] Child updated id={}", saved.getId());
        return saved;
    }

    public void deleteChild(UUID id, UUID parentId) {
        log.info("[ChildService] deleteChild id={} parentId={}", id, parentId);
        Child child = getChild(id, parentId);
        childRepository.delete(child);
        log.info("[ChildService] Child deleted id={}", id);
    }
}
