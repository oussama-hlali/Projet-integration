package com.smartcampus.identity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan("com.smartcampus")
public class IdentityApplication {
    public static void main(String[] args) {
        SpringApplication.run(IdentityApplication.class, args);
    }
}
