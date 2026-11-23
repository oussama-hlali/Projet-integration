package com.smartcampus.identity.dto;

/**
 * Session payload returned after login/MFA and after a silent cookie refresh.
 * The refresh token is deliberately absent: it lives only in an HttpOnly cookie.
 */
public record SessionResponse(
        String accessToken,
        int expiresIn,
        UserDto user
) {}
