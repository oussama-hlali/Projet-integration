package com.smartcampus.identity.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        int expiresIn,
        UserDto user
) {}
