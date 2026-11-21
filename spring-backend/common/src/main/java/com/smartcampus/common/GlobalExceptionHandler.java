package com.smartcampus.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Turns exceptions into the shared ProblemDetails shape so the frontend
 * interceptor can show a single, consistent toast.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ProblemDetails> handleIllegalArgument(IllegalArgumentException ex) {
        ProblemDetails problem = ProblemDetails.of(
                HttpStatus.BAD_REQUEST.value(),
                "Bad request",
                ex.getMessage(),
                "BAD_REQUEST"
        );
        return ResponseEntity.badRequest().body(problem);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetails> handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("Validation failed");
        ProblemDetails problem = ProblemDetails.of(
                HttpStatus.BAD_REQUEST.value(),
                "Validation failed",
                detail,
                "VALIDATION_FAILED"
        );
        return ResponseEntity.badRequest().body(problem);
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetails> handleUnreadable(
            org.springframework.http.converter.HttpMessageNotReadableException ex) {
        ProblemDetails problem = ProblemDetails.of(
                HttpStatus.BAD_REQUEST.value(),
                "Malformed request body",
                "Request body could not be parsed as JSON",
                "BAD_REQUEST"
        );
        return ResponseEntity.badRequest().body(problem);
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ProblemDetails> handleResponseStatus(org.springframework.web.server.ResponseStatusException ex) {
        int status = ex.getStatusCode().value();
        String reason = ex.getReason() != null ? ex.getReason() : "Request failed";
        String code = status == 409 ? "CONFLICT"
                : status == 401 ? "UNAUTHORIZED"
                : status == 404 ? "NOT_FOUND"
                : "ERROR";
        ProblemDetails problem = ProblemDetails.of(status, reason, reason, code);
        return ResponseEntity.status(status).body(problem);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetails> handleGeneric(Exception ex) {
        ex.printStackTrace();
        ProblemDetails problem = ProblemDetails.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal server error",
                ex.getClass().getSimpleName() + ": " + ex.getMessage(),
                "INTERNAL_ERROR"
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
    }
}
