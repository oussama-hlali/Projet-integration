package com.smartcampus.cafeteria;

import com.smartcampus.common.GlobalExceptionHandler;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

@SpringBootApplication
@Import(GlobalExceptionHandler.class)
public class CafeteriaApplication {
    public static void main(String[] args) {
        SpringApplication.run(CafeteriaApplication.class, args);
    }
}
