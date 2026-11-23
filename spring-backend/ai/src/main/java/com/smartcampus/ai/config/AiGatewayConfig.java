package com.smartcampus.ai.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/** HTTP client used only for live KPI reads through the gateway. */
@Configuration
public class AiGatewayConfig {

    @Bean(name = "kpiRestClient")
    public RestClient kpiRestClient(AiGatewayProperties properties, RestClient.Builder restClientBuilder) {
        int timeout = (int) Math.min(Math.max(1, properties.getTimeoutMs()), Integer.MAX_VALUE);
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeout);
        factory.setReadTimeout(timeout);
        return restClientBuilder
                .baseUrl(properties.normalizedBaseUrl())
                .requestFactory(factory)
                .build();
    }
}
