package com.smartcampus.identity.dto;

public record MfaChallenge(boolean mfaRequired, String challengeId) {}
