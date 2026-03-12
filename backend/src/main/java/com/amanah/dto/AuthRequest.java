package com.amanah.dto;

public record AuthRequest(String email, String password, String fullName, String role) {}
