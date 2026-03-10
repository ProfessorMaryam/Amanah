package com.amanah.controller;

import com.amanah.dto.UserProfileRequest;
import com.amanah.entity.User;
import com.amanah.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<User> getProfile(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(userService.getById(userId));
    }

    @PutMapping
    public ResponseEntity<User> updateProfile(@AuthenticationPrincipal UUID userId,
                                              @Valid @RequestBody UserProfileRequest req) {
        return ResponseEntity.ok(userService.updateProfile(userId, req.fullName(), req.phone()));
    }
}
