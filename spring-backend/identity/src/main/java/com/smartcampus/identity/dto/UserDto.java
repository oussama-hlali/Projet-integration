package com.smartcampus.identity.dto;

public record UserDto(
        String id,
        String fullName,
        String email,
        String role,
        boolean totpEnabled
) {}
