package com.smartcampus.common;

/**
 * RFC 9457 problem detail returned by every service on error.
 * The frontend interceptor reads `detail` for the toast body and `code`
 * for branching (conflict / sold out / full).
 */
public record ProblemDetails(
        String type,
        String title,
        int status,
        String detail,
        String code
) {
    public static ProblemDetails of(int status, String title, String detail, String code) {
        return new ProblemDetails(
                "https://smartcampus/errors/" + code.toLowerCase().replace('_', '-'),
                title,
                status,
                detail,
                code
        );
    }
}
