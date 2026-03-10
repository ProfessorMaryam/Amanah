package com.amanah.dto;

public record AuthResponse(String token, UserDto user) {
    public record UserDto(String id, String email, String fullName, String role) {}
}
