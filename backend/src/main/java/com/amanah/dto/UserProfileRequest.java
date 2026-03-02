package com.amanah.dto;

import jakarta.validation.constraints.Size;

public record UserProfileRequest(
        @Size(max = 200) String fullName,
        @Size(max = 30) String phone
) {}
