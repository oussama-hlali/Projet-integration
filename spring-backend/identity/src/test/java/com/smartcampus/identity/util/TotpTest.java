package com.smartcampus.identity.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TotpTest {

    @Test
    void generatedCodeVerifies() {
        String secret = Totp.generateSecret();
        long step = System.currentTimeMillis() / 1000 / 30;
        String code = Totp.code(secret, step);
        assertThat(code).hasSize(6);
        assertThat(Totp.verify(secret, code, null)).isTrue();
    }

    @Test
    void wrongCodeDoesNotVerify() {
        String secret = Totp.generateSecret();
        assertThat(Totp.verify(secret, "000000", null)).isFalse();
    }

    @Test
    void replayIsRejected() {
        String secret = Totp.generateSecret();
        long step = System.currentTimeMillis() / 1000 / 30;
        String code = Totp.code(secret, step);
        assertThat(Totp.verify(secret, code, step)).isFalse(); // lastUsed == step
    }

    @Test
    void otpauthUriContainsSecret() {
        String secret = Totp.generateSecret();
        assertThat(Totp.otpauthUri(secret, "a@b.com")).contains("secret=" + secret);
    }
}
