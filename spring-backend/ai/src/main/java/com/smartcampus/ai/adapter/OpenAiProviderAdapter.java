package com.smartcampus.ai.adapter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.ai.config.AiProviderProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Consumer;

/**
 * Real LLM provider using any OpenAI-compatible /chat/completions and
 * /embeddings API. The API key stays server-side; the mobile/web clients only
 * talk to our own gateway.
 */
@Component
@ConditionalOnProperty(prefix = "ai.provider", name = "type", havingValue = "openai")
public class OpenAiProviderAdapter implements ProviderAdapter {

    private final AiProviderProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final HttpClient streamingClient;

    public OpenAiProviderAdapter(AiProviderProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;

        String apiKey = properties.getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("AI_API_KEY is required when AI_PROVIDER=openai");
        }
        String base = properties.normalizedBaseUrl();
        if (base.isEmpty()) {
            throw new IllegalStateException("AI_BASE_URL is required when AI_PROVIDER=openai");
        }

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        int timeout = (int) Math.max(1, properties.getTimeoutMs());
        factory.setConnectTimeout(timeout);
        factory.setReadTimeout(timeout);

        this.restClient = RestClient.builder()
                .baseUrl(base)
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.streamingClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(timeout))
                .build();
    }

    @Override
    public String name() {
        return "openai";
    }

    @Override
    public String chat(String prompt, List<String> availableTools) {
        return chat("", List.of(), prompt, availableTools);
    }

    @Override
    public String chat(String systemPrompt, List<ChatTurn> history, String userMessage,
                       List<String> availableTools) {
        JsonNode response = restClient.post()
                .uri("/chat/completions")
                .body(chatBody(systemPrompt, history, userMessage, availableTools, false))
                .retrieve()
                .body(JsonNode.class);

        if (response == null) return "";
        JsonNode choice = response.path("choices").path(0);
        if (choice.isMissingNode()) return "";
        return text(choice.path("message"), "content");
    }

    @Override
    public void stream(String systemPrompt, List<ChatTurn> history, String userMessage,
                       List<String> availableTools, Consumer<String> tokenConsumer) {
        Map<String, Object> body = chatBody(systemPrompt, history, userMessage, availableTools, true);
        HttpRequest request = HttpRequest.newBuilder(URI.create(properties.normalizedBaseUrl() + "/chat/completions"))
                .timeout(Duration.ofMillis(Math.max(1, properties.getTimeoutMs())))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getApiKey())
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .POST(HttpRequest.BodyPublishers.ofString(writeJson(body)))
                .build();

        try {
            HttpResponse<InputStream> response = streamingClient.send(
                    request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() >= 300) {
                String error = new String(response.body().readAllBytes(), StandardCharsets.UTF_8);
                throw new IllegalStateException("AI provider returned " + response.statusCode() + ": " + error);
            }
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (!line.startsWith("data:")) continue;
                    String payload = line.substring(5).trim();
                    if (payload.isEmpty() || "[DONE]".equals(payload)) break;
                    JsonNode event = objectMapper.readTree(payload);
                    JsonNode choice = event.path("choices").path(0);
                    if (choice.isMissingNode()) continue;
                    JsonNode delta = choice.has("delta") ? choice.path("delta") : choice.path("message");
                    String token = text(delta, "content");
                    if (!token.isEmpty()) tokenConsumer.accept(token);
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI streaming was interrupted", e);
        } catch (Exception e) {
            throw new IllegalStateException("AI streaming failed", e);
        }
    }

    @Override
    public float[] embed(String text) {
        Map<String, Object> body = Map.of(
                "model", properties.getEmbeddingModel(),
                "input", text == null ? "" : text);
        JsonNode response = restClient.post()
                .uri("/embeddings")
                .body(body)
                .retrieve()
                .body(JsonNode.class);
        if (response == null) return new float[0];
        JsonNode values = response.path("data").path(0).path("embedding");
        if (!values.isArray()) return new float[0];
        float[] embedding = new float[values.size()];
        for (int i = 0; i < values.size(); i++) embedding[i] = (float) values.get(i).asDouble();
        return embedding;
    }

    private Map<String, Object> chatBody(String systemPrompt, List<ChatTurn> history,
                                         String userMessage, List<String> tools, boolean stream) {
        boolean gptOss = isGptOssModel();
        List<Map<String, String>> messages = new ArrayList<>();
        StringBuilder system = new StringBuilder(systemPrompt == null ? "" : systemPrompt);
        if (tools != null && !tools.isEmpty()) {
            system.append("\nAvailable actions you may propose (never execute them yourself): ")
                    .append(String.join(", ", tools));
        }
        String userText = userMessage == null ? "" : userMessage;

        if (gptOss) {
            // Groq recommends putting instructions in the user message for GPT-OSS models.
            if (history != null) {
                history.forEach(turn -> messages.add(message(turn.role(), turn.content())));
            }
            String guidedUserText = system.length() == 0
                    ? userText
                    : system.append("\n\n").append(userText).toString();
            messages.add(message("user", guidedUserText));
        } else {
            messages.add(message("system", system.toString()));
            if (history != null) {
                history.forEach(turn -> messages.add(message(turn.role(), turn.content())));
            }
            messages.add(message("user", userText));
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", properties.getModel());
        body.put("messages", messages);
        body.put("temperature", gptOss ? 0.6 : 0.4);
        body.put(gptOss ? "max_completion_tokens" : "max_tokens", 1024);
        body.put("stream", stream);
        return body;
    }

    private boolean isGptOssModel() {
        String model = properties.getModel() == null ? "" : properties.getModel().toLowerCase(Locale.ROOT);
        String base = properties.normalizedBaseUrl().toLowerCase(Locale.ROOT);
        return model.contains("gpt-oss") || base.contains("groq");
    }

    private Map<String, String> message(String role, String content) {
        return Map.of("role", role, "content", content);
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() ? "" : value.asText();
    }

    private String writeJson(Object body) {
        try {
            return objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to serialize AI request", e);
        }
    }
}
