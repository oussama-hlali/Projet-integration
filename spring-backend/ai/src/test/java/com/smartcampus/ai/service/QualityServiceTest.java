package com.smartcampus.ai.service;

import com.smartcampus.ai.adapter.ProviderAdapter;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class QualityServiceTest {

    @Test
    void dashboardReportsTheActiveProvider() {
        ProviderAdapter provider = mock(ProviderAdapter.class);
        when(provider.name()).thenReturn("openai");

        QualityService quality = new QualityService(provider);
        quality.recordRequest();
        quality.recordBlocked();

        assertThat(quality.dashboard())
                .containsEntry("provider", "openai")
                .containsEntry("requests", 1)
                .containsEntry("blocked", 1);
    }
}
