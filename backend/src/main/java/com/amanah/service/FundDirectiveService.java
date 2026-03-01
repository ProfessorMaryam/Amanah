package com.amanah.service;

import com.amanah.entity.FundDirective;
import com.amanah.repository.FundDirectiveRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FundDirectiveService {

    private static final Logger log = LoggerFactory.getLogger(FundDirectiveService.class);

    private final FundDirectiveRepository directiveRepository;

    public FundDirective getByChild(UUID childId) {
        log.debug("[FundDirectiveService] getByChild childId={}", childId);
        return directiveRepository.findByChildId(childId)
                .orElseThrow(() -> {
                    log.warn("[FundDirectiveService] No directive found for childId={}", childId);
                    return new RuntimeException("No directive found");
                });
    }

    public Optional<FundDirective> findByChild(UUID childId) {
        log.debug("[FundDirectiveService] findByChild childId={}", childId);
        return directiveRepository.findByChildId(childId);
    }

    public FundDirective save(UUID childId, String guardianName, String guardianContact, String instructions) {
        log.info("[FundDirectiveService] save childId={} guardian={}", childId, guardianName);
        FundDirective directive = directiveRepository.findByChildId(childId).orElse(new FundDirective());
        directive.setChildId(childId);
        directive.setGuardianName(guardianName);
        directive.setGuardianContact(guardianContact);
        directive.setInstructions(instructions);
        FundDirective saved = directiveRepository.save(directive);
        log.info("[FundDirectiveService] Saved directive id={} for childId={}", saved.getId(), childId);
        return saved;
    }
}
