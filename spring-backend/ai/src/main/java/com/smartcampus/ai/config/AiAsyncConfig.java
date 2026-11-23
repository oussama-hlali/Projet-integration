package com.smartcampus.ai.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;

/** Managed executors for SSE streams and parallel live-KPI reads. */
@Configuration
public class AiAsyncConfig {

    @Bean(name = "aiStreamExecutor")
    public ThreadPoolTaskExecutor aiStreamExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("ai-stream-");
        executor.initialize();
        return executor;
    }

    /** Fetches the five independent KPI endpoints concurrently per assistant request. */
    @Bean(name = "aiKpiExecutor")
    public ThreadPoolTaskExecutor aiKpiExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("ai-kpi-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
