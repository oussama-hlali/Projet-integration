package com.smartcampus.ai.controller;

import com.smartcampus.ai.service.SearchService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class SearchController {
    private final SearchService service;
    public SearchController(SearchService service) { this.service = service; }

    @PostMapping("/search")
    public List<Map<String, Object>> search(@RequestBody Map<String, Object> body) {
        String query = (String) body.get("query");
        String sourceType = (String) body.get("sourceType");
        int topK = body.get("topK") == null ? 5 : ((Number) body.get("topK")).intValue();
        return service.search(query, sourceType, topK);
    }

    @PostMapping("/match/lost-found")
    public List<Map<String, Object>> matchLostFound(@RequestBody Map<String, Object> body) {
        String query = (String) body.get("query");
        // reasons: keyword overlap + semantic score
        return service.search(query, "lost_found", 10).stream().map(m -> {
            Map<String, Object> r = new java.util.HashMap<>(m);
            r.put("reason", "Semantic similarity to your query");
            return r;
        }).toList();
    }
}
