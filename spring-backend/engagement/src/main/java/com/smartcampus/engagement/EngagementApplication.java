package com.smartcampus.engagement;

import com.smartcampus.common.GlobalExceptionHandler;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

@SpringBootApplication
@Import(GlobalExceptionHandler.class)
public class EngagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(EngagementApplication.class, args);
    }
}
