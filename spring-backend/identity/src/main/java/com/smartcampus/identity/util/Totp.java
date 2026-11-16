package com.smartcampus.identity.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Minimal RFC 6238 TOTP helper. No external dependency.
 */
public final class Totp {

    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int PERIOD_SECONDS = 30;
    private static final int DIGITS = 6;

    private Totp() {}

    public static String generateSecret() {
        byte[] bytes = new byte[20];
        new SecureRandom().nextBytes(bytes);
        return base32Encode(bytes);
    }

    public static String code(String secret, long timeStep) {
        try {
            byte[] key = base32Decode(secret);
            byte[] msg = ByteBuffer.allocate(8).putLong(timeStep).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(msg);
            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            return String.format("%0" + DIGITS + "d", binary % 1_000_000);
        } catch (Exception e) {
            throw new IllegalStateException("TOTP computation failed", e);
        }
    }

    /** Returns true if the code is valid and not a replay. Caller updates lastUsed. */
    public static boolean verify(String secret, String code, Long lastUsed) {
        if (secret == null || code == null || code.length() != DIGITS) return false;
        long now = System.currentTimeMillis() / 1000 / PERIOD_SECONDS;
        for (int w = -1; w <= 1; w++) {
            if (code.equals(code(secret, now + w))) {
                long step = now + w;
                if (lastUsed != null && step <= lastUsed) return false; // replay guard
                return true;
            }
        }
        return false;
    }

    public static String otpauthUri(String secret, String email) {
        return "otpauth://totp/SmartCampus:" + email
                + "?secret=" + secret + "&issuer=SmartCampus&digits=6&period=30";
    }

    private static String base32Encode(byte[] data) {
        StringBuilder out = new StringBuilder();
        int buffer = 0, bitsLeft = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                out.append(ALPHABET.charAt((buffer >> (bitsLeft - 5)) & 0x1F));
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0) {
            out.append(ALPHABET.charAt((buffer << (5 - bitsLeft)) & 0x1F));
        }
        return out.toString();
    }

    private static byte[] base32Decode(String s) {
        s = s.toUpperCase().replaceAll("[^A-Z2-7]", "");
        int buffer = 0, bitsLeft = 0;
        byte[] out = new byte[s.length() * 5 / 8];
        int idx = 0;
        for (char c : s.toCharArray()) {
            int val = ALPHABET.indexOf(c);
            if (val < 0) continue;
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                out[idx++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xFF);
                bitsLeft -= 8;
            }
        }
        return out;
    }
}
