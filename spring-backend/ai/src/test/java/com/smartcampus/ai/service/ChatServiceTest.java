package com.smartcampus.ai.service;

import com.smartcampus.ai.adapter.ProviderAdapter;
import com.smartcampus.ai.domain.AiMessage;
import com.smartcampus.ai.repository.AiMessageRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ChatServiceTest {

    private final ProviderAdapter provider = mock(ProviderAdapter.class);
    private final AiMessageRepository messages = mock(AiMessageRepository.class);
    private final ModerationService moderation = mock(ModerationService.class);
    private final BudgetService budget = mock(BudgetService.class);
    private final ChatService service = new ChatService(provider, messages, moderation, budget);

    @Test
    void chatPassesHistoryToProviderAndPersistsBothMessages() {
        when(moderation.isSafe("hello")).thenReturn(true);
        when(budget.hasBudget("u1", 100)).thenReturn(true);
        when(provider.chat(anyString(), anyList(), eq("hello"), anyList())).thenReturn("model reply");

        String reply = service.chat("u1", "hello", List.of());

        assertThat(reply).isEqualTo("model reply");
        ArgumentCaptor<List> history = ArgumentCaptor.forClass(List.class);
        verify(provider).chat(anyString(), history.capture(), eq("hello"), anyList());
        assertThat(history.getValue()).isEmpty();
        verify(messages, times(2)).save(any(AiMessage.class));
        verify(budget).recordUsage("u1", 100);
    }
}
