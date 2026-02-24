package com.amanah.service;

import com.amanah.entity.User;
import com.amanah.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getOrCreate(UUID id, String email) {
        return userRepository.findById(id).orElseGet(() -> {
            User user = User.builder().id(id).email(email).build();
            return userRepository.save(user);
        });
    }

    public User updateProfile(UUID id, String fullName, String phone) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setFullName(fullName);
        user.setPhone(phone);
        return userRepository.save(user);
    }
}
