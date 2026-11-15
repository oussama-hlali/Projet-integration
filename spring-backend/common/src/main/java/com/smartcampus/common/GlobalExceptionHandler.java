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

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetails> handleGeneric(Exception ex) {
        ProblemDetails problem = ProblemDetails.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal server error",
                "The server ran into a problem. Try again shortly.",
                "INTERNAL_ERROR"
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
    }
}
