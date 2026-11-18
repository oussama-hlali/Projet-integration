package com.smartcampus.ai.service;

import com.smartcampus.ai.adapter.ProviderAdapter;
import com.smartcampus.ai.domain.AiEmbedding;
import com.smartcampus.ai.repository.AiEmbeddingRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class EmbeddingService {
    private final ProviderAdapter provider;
    private final AiEmbeddingRepository repo;

    public EmbeddingService(ProviderAdapter provider, AiEmbeddingRepository repo) {
        this.provider = provider; this.repo = repo;
    }

    public AiEmbedding index(String sourceType, String sourceId, String text) {
        AiEmbedding e = new AiEmbedding();
        e.setId("emb" + UUID.randomUUID().toString().substring(0, 8));
        e.setSourceType(sourceType);
        e.setSourceId(sourceId);
        e.setText(text);
        float[] v = provider.embed(text);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < v.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(v[i]);
        }
        e.setVector(sb.toString());
        return repo.save(e);
    }

    public List<AiEmbedding> all(String sourceType) {
        return sourceType == null ? repo.findAll() : repo.findBySourceType(sourceType);
    }

    public static double cosine(float[] a, float[] b) {
        double dot = 0, na = 0, nb = 0;
        int n = Math.min(a.length, b.length);
        for (int i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
        if (na == 0 || nb == 0) return 0;
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }
}
