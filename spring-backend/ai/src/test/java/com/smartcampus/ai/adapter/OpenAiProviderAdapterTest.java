package com.smartcampus.ai.adapter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.ai.config.AiProviderProperties;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

class OpenAiProviderAdapterTest {

    private MockWebServer server;
    private OpenAiProviderAdapter adapter;

    @BeforeEach
    void setUp() throws Exception {
        server = new MockWebServer();
        server.start();
        AiProviderProperties properties = new AiProviderProperties();
        properties.setType("openai");
        properties.setApiKey("test-key");
        properties.setModel("test-model");
        properties.setEmbeddingModel("test-embedding");
        properties.setBaseUrl(server.url("/").toString());
        adapter = new OpenAiProviderAdapter(properties, new ObjectMapper());
    }

    @AfterEach
    void tearDown() throws Exception {
        server.shutdown();
    }

    @Test
    void chatSendsHistoryAndToolsAndParsesReply() throws Exception {
        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody("{\"choices\":[{\"message\":{\"content\":\"Hello from the model\"}}]}"));

        String reply = adapter.chat(
                "You are Smart Campus",
                List.of(new ChatTurn("user", "previous question"), new ChatTurn("assistant", "previous answer")),
                "hello",
                List.of("reserveRoom"));

        assertThat(reply).isEqualTo("Hello from the model");
        RecordedRequest request = server.takeRequest(5, TimeUnit.SECONDS);
        assertThat(request).isNotNull();
        assertThat(request.getPath()).isEqualTo("/chat/completions");
        assertThat(request.getHeader("Authorization")).isEqualTo("Bearer test-key");
        String body = request.getBody().readUtf8();
        assertThat(body).contains("previous question").contains("reserveRoom").contains("\"stream\":false");
    }

    @Test
    void streamEmitsTokensFromRealSseEvents() throws Exception {
        String sse = "data: {\"choices\":[{\"delta\":{\"content\":\"Hel\"}}]}\n\n"
                + "data: {\"choices\":[{\"delta\":{\"content\":\"lo\"}}]}\n\n"
                + "data: [DONE]\n\n";
        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "text/event-stream")
                .setBody(sse));

        List<String> tokens = new ArrayList<>();
        adapter.stream("You are Smart Campus", List.of(), "hello", List.of(), tokens::add);

        assertThat(tokens).containsExactly("Hel", "lo");
        RecordedRequest request = server.takeRequest(5, TimeUnit.SECONDS);
        assertThat(request).isNotNull();
        assertThat(request.getBody().readUtf8()).contains("\"stream\":true");
    }

    @Test
    void groqGptOssUsesCompletionTokensAndUserGuidance() throws Exception {
        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody("{\"choices\":[{\"message\":{\"content\":\"Hello\"}}]}"));

        AiProviderProperties props = new AiProviderProperties();
        props.setType("openai");
        props.setApiKey("test-key");
        props.setModel("openai/gpt-oss-20b");
        props.setBaseUrl(server.url("/openai/v1/").toString());
        OpenAiProviderAdapter gptOssAdapter = new OpenAiProviderAdapter(props, new ObjectMapper());

        String reply = gptOssAdapter.chat("You are Smart Campus", List.of(), "hello", List.of());

        assertThat(reply).isEqualTo("Hello");
        RecordedRequest request = server.takeRequest(5, TimeUnit.SECONDS);
        assertThat(request).isNotNull();
        assertThat(request.getPath()).isEqualTo("/openai/v1/chat/completions");
        String body = request.getBody().readUtf8();
        assertThat(body).contains("\"max_completion_tokens\":1024")
                .doesNotContain("\"max_tokens\"")
                .doesNotContain("\"role\":\"system\"")
                .contains("You are Smart Campus");
    }

    @Test
    void embedParsesVectorFromProvider() throws Exception {
        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody("{\"data\":[{\"embedding\":[0.5, -0.25]}]}"));

        float[] embedding = adapter.embed("campus");

        assertThat(embedding).containsExactly(0.5f, -0.25f);
    }
}
