package com.smartcampus.ai.controller;

import com.smartcampus.ai.service.ChatService;
import com.smartcampus.ai.service.KpiContextService;
import com.smartcampus.ai.service.ModerationService;
import com.smartcampus.ai.service.ProposalService;
import com.smartcampus.ai.service.QualityService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AssistantControllerTest {

    private final ChatService chat = mock(ChatService.class);
    private final ModerationService moderation = mock(ModerationService.class);
    private final QualityService quality = mock(QualityService.class);
    private final ProposalService proposals = mock(ProposalService.class);
    private final KpiContextService kpiContext = mock(KpiContextService.class);
    private final AssistantController controller = new AssistantController(
            chat, moderation, quality, proposals, kpiContext, Runnable::run);

    @Test
    void messagesForwardsAuthorizationAndPassesLiveKpiContextToChat() {
        String context = "LIVE CAMPUS KPI CONTEXT: campus: roomsAvailable=12";
        when(moderation.isSafe("rooms?")).thenReturn(true);
        when(kpiContext.describe("Bearer jwt")).thenReturn(context);
        when(chat.chat(eq("u1"), eq("rooms?"), anyList(), eq(context))).thenReturn("12 rooms.");

        Map<String, Object> response = controller.messages(
                Map.of("userId", "u1", "message", "rooms?"), "Bearer jwt");

        assertThat(response).containsEntry("reply", "12 rooms.");
        verify(kpiContext).describe("Bearer jwt");
        verify(chat).chat(eq("u1"), eq("rooms?"), anyList(), eq(context));
    }

    @Test
    void messagesStillAnswersWhenKpiEnrichmentFails() {
        when(moderation.isSafe("rooms?")).thenReturn(true);
        when(kpiContext.describe("Bearer jwt")).thenThrow(new IllegalStateException("gateway down"));
        when(chat.chat(eq("u1"), eq("rooms?"), anyList(), anyString())).thenReturn("I have no live data.");

        Map<String, Object> response = controller.messages(
                Map.of("userId", "u1", "message", "rooms?"), "Bearer jwt");

        assertThat(response).containsEntry("reply", "I have no live data.");
        ArgumentCaptor<String> context = ArgumentCaptor.forClass(String.class);
        verify(chat).chat(eq("u1"), eq("rooms?"), anyList(), context.capture());
        assertThat(context.getValue()).contains("KPI data is temporarily unavailable");
    }

    @Test
    void streamForwardsAuthorizationAndPassesLiveKpiContext() {
        String context = "LIVE CAMPUS KPI CONTEXT: notifications: notificationsUnread=9";
        when(moderation.isSafe("alerts?")).thenReturn(true);
        when(kpiContext.describe("Bearer jwt")).thenReturn(context);
        doAnswer(invocation -> {
            Consumer<String> consumer = invocation.getArgument(4);
            consumer.accept("9 unread.");
            return "9 unread.";
        }).when(chat).stream(eq("u1"), eq("alerts?"), anyList(), eq(context), any());

        var response = controller.stream("u1", "alerts?", "Bearer jwt");

        assertThat(response.getBody()).isInstanceOf(SseEmitter.class);
        verify(kpiContext).describe("Bearer jwt");
        verify(chat).stream(eq("u1"), eq("alerts?"), eq(List.of()), eq(context), any());
    }
}
