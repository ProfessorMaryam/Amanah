package com.amanah.service;

import com.amanah.entity.User;
import com.amanah.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    public User getOrCreate(UUID id, String email) {
        return userRepository.findById(id).orElseGet(() -> {
            log.info("[UserService] Creating new user id={} email={}", id, email);
            User user = User.builder().id(id).email(email).build();
            User saved = userRepository.save(user);
            log.info("[UserService] Created user id={}", saved.getId());
            return saved;
        });
    }

    public User updateProfile(UUID id, String fullName, String phone) {
        log.info("[UserService] updateProfile id={} fullName={}", id, fullName);
        User user = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("[UserService] User not found id={}", id);
                    return new RuntimeException("User not found");
                });
        user.setFullName(fullName);
        user.setPhone(phone);
        User saved = userRepository.save(user);
        log.info("[UserService] Profile updated for id={}", id);
        return saved;
    }
}
