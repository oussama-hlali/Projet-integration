package com.smartcampus.campus;

import com.smartcampus.common.GlobalExceptionHandler;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
// The shared ProblemDetails handler lives in `common`; without this import a
// missing announcement id or a bad payload becomes an opaque 500.
@Import(GlobalExceptionHandler.class)
public class CampusApplication {
    public static void main(String[] args) {
        SpringApplication.run(CampusApplication.class, args);
    }
}
