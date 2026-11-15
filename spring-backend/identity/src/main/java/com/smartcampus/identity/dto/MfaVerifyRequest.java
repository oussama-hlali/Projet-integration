package com.smartcampus.identity.dto;

public record MfaVerifyRequest(String challengeId, String code) {}
