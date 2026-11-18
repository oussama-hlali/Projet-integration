package com.smartcampus.ai.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ai_embeddings", schema = "ai")
public class AiEmbedding {
    @Id
    @Column(length = 64)
    private String id;
    @Column(name = "source_type", length = 32, nullable = false)
    private String sourceType; // event, lost_found, menu, announcement
    @Column(name = "source_id", length = 64, nullable = false)
    private String sourceId;
    @Column(length = 1000, nullable = false)
    private String text;
    @Column(length = 4000, nullable = false)
    private String vector; // comma-separated floats

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getVector() { return vector; }
    public void setVector(String vector) { this.vector = vector; }

    public float[] vectorArray() {
        String[] parts = vector.split(",");
        float[] out = new float[parts.length];
        for (int i = 0; i < parts.length; i++) out[i] = Float.parseFloat(parts[i].trim());
        return out;
    }
}
