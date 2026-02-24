package com.amanah.dto;

import java.time.LocalDate;

public record ChildRequest(String name, LocalDate dateOfBirth, String photoUrl) {}
