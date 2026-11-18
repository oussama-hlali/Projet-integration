package com.smartcampus.ai.service;

import com.smartcampus.ai.domain.AiEmbedding;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SearchService {
    private final EmbeddingService embeddings;
    private final com.smartcampus.ai.adapter.ProviderAdapter provider;

    public SearchService(EmbeddingService embeddings, com.smartcampus.ai.adapter.ProviderAdapter provider) {
        this.embeddings = embeddings; this.provider = provider;
    }

    public List<Map<String, Object>> search(String query, String sourceType, int topK) {
        float[] qv = provider.embed(query);
        return embeddings.all(sourceType).stream()
                .map(e -> Map.<String, Object>of(
                        "sourceId", e.getSourceId(),
                        "sourceType", e.getSourceType(),
                        "text", e.getText(),
                        "score", EmbeddingService.cosine(qv, e.vectorArray())))
                .sorted(Comparator.comparingDouble(m -> -((Double) m.get("score"))))
                .limit(topK)
                .collect(Collectors.toList());
    }
}
