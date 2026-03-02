package com.amanah.dto;

import jakarta.validation.constraints.Size;

public record FundDirectiveRequest(
        @Size(max = 200) String guardianName,
        @Size(max = 200) String guardianContact,
        @Size(max = 5000) String instructions
) {}
