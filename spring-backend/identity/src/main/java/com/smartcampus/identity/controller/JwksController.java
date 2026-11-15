package com.smartcampus.identity.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.interfaces.RSAPublicKey;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Exposes the public key as a JWKS so the gateway and the other services can
 * validate access tokens locally (no call back to identity on every request).
 */
@RestController
public class JwksController {

    private static final String KEY_ID = "identity-key-1";

    private final RSAPublicKey publicKey;

    public JwksController(RSAPublicKey publicKey) {
        this.publicKey = publicKey;
    }

    @GetMapping("/.well-known/jwks.json")
    public Map<String, Object> jwks() {
        return Map.of("keys", List.of(Map.of(
                "kty", "RSA",
                "kid", KEY_ID,
                "use", "sig",
                "alg", "RS256",
                "n", base64Url(publicKey.getModulus().toByteArray()),
                "e", base64Url(publicKey.getPublicExponent().toByteArray())
        )));
    }

    private static String base64Url(byte[] bytes) {
        // Strip leading zero byte added by BigInteger for sign, then encode.
        int start = (bytes.length > 1 && bytes[0] == 0) ? 1 : 0;
        byte[] trimmed = new byte[bytes.length - start];
        System.arraycopy(bytes, start, trimmed, 0, trimmed.length);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(trimmed);
    }
}
