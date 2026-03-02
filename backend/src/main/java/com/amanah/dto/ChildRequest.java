package com.amanah.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ChildRequest(
        @NotBlank @Size(max = 100) String name,
        @PastOrPresent LocalDate dateOfBirth,
        @Size(max = 2048) String photoUrl
) {}
