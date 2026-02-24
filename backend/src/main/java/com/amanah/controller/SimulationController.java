package com.amanah.controller;

import com.amanah.service.SimulationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/simulate")
@RequiredArgsConstructor
public class SimulationController {

    private final SimulationService simulationService;

    @PostMapping("/monthly")
    public ResponseEntity<Map<String, Object>> runMonthly(@AuthenticationPrincipal UUID parentId) {
        int processed = simulationService.runMonthlySimulation(parentId);
        return ResponseEntity.ok(Map.of("goalsProcessed", processed));
    }
}
