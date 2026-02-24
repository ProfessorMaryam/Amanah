package com.amanah.service;

import com.amanah.entity.FundDirective;
import com.amanah.repository.FundDirectiveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FundDirectiveService {

    private final FundDirectiveRepository directiveRepository;

    public FundDirective getByChild(UUID childId) {
        return directiveRepository.findByChildId(childId)
                .orElseThrow(() -> new RuntimeException("No directive found"));
    }

    public java.util.Optional<FundDirective> findByChild(UUID childId) {
        return directiveRepository.findByChildId(childId);
    }

    public FundDirective save(UUID childId, String guardianName, String guardianContact, String instructions) {
        FundDirective directive = directiveRepository.findByChildId(childId).orElse(new FundDirective());
        directive.setChildId(childId);
        directive.setGuardianName(guardianName);
        directive.setGuardianContact(guardianContact);
        directive.setInstructions(instructions);
        return directiveRepository.save(directive);
    }
}
