package com.smartcampus.identity.dto;

/**
 * Returned after a password check. No access token is issued until the caller
 * completes TOTP verification; `setupRequired` means this account still needs
 * to enrol a secret before it can verify.
 */
public record MfaChallenge(
        boolean mfaRequired,
        boolean setupRequired,
        String challengeId,
        String userId
) {}
