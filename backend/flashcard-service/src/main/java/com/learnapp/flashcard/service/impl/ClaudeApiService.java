package com.learnapp.flashcard.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnapp.flashcard.exception.AppException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class ClaudeApiService {

    @Value("${ai.claude.api-key}")
    private String apiKey;

    @Value("${ai.claude.model:claude-sonnet-4-6}")
    private String model;

    @Value("${ai.claude.max-tokens:2048}")
    private int maxTokens;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public ClaudeApiService(ObjectMapper objectMapper) {
        this.webClient = WebClient.builder()
                .baseUrl("https://api.anthropic.com")
                .build();
        this.objectMapper = objectMapper;
    }

    /**
     * Record representing a single generated flashcard from Claude API.
     */
    public record GeneratedCard(String front, String back) {}

    /**
     * Calls Claude API to generate flashcard pairs from the given text.
     *
     * @param text     source text to generate cards from
     * @param maxCards maximum number of cards to generate
     * @return list of generated front/back card pairs
     */
    public List<GeneratedCard> generateFlashcards(String text, int maxCards) {
        // Validate API key is configured
        if (apiKey == null || apiKey.isBlank()) {
            throw new AppException("Claude API key not configured", HttpStatus.SERVICE_UNAVAILABLE);
        }

        // Build prompt
        String prompt = String.format(
                "Từ đoạn văn bản sau, hãy tạo tối đa %d cặp câu hỏi-đáp án để học bằng flashcard.\n" +
                "Trả về dưới dạng JSON array với format sau (không có markdown, chỉ JSON thuần):\n" +
                "[{\"front\": \"câu hỏi\", \"back\": \"câu trả lời\"}, ...]\n\n" +
                "Văn bản:\n%s",
                maxCards, text
        );

        // Build request body
        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", maxTokens,
                "messages", List.of(
                        Map.of("role", "user", "content", prompt)
                )
        );

        // Call Claude API synchronously (block for simplicity in servlet-based stack)
        String responseBody;
        try {
            responseBody = webClient.post()
                    .uri("/v1/messages")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .header("content-type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(
                            status -> status.is4xxClientError() || status.is5xxServerError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .map(body -> new AppException(
                                            "Claude API error: " + body,
                                            HttpStatus.valueOf(clientResponse.statusCode().value())
                                    ))
                    )
                    .bodyToMono(String.class)
                    .block();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException("Failed to call Claude API: " + e.getMessage(), HttpStatus.SERVICE_UNAVAILABLE);
        }

        if (responseBody == null) {
            throw new AppException("Empty response from Claude API", HttpStatus.SERVICE_UNAVAILABLE);
        }

        // Parse the Claude response to extract the content text
        return parseClaudeResponse(responseBody);
    }

    /**
     * Parses the Claude API response JSON and extracts the list of GeneratedCard objects.
     */
    private List<GeneratedCard> parseClaudeResponse(String responseBody) {
        try {
            // Claude response format: { "content": [{"type": "text", "text": "...json..."}] }
            Map<String, Object> response = objectMapper.readValue(responseBody, new TypeReference<>() {});
            List<?> contentList = (List<?>) response.get("content");
            if (contentList == null || contentList.isEmpty()) {
                throw new AppException("No content in Claude API response", HttpStatus.SERVICE_UNAVAILABLE);
            }

            Map<?, ?> firstContent = (Map<?, ?>) contentList.get(0);
            String text = (String) firstContent.get("text");
            if (text == null || text.isBlank()) {
                throw new AppException("Empty text content in Claude API response", HttpStatus.SERVICE_UNAVAILABLE);
            }

            // Extract JSON array from the text (Claude may wrap it in markdown)
            String jsonText = extractJsonArray(text);

            return objectMapper.readValue(jsonText, new TypeReference<List<GeneratedCard>>() {});
        } catch (AppException e) {
            throw e;
        } catch (JsonProcessingException e) {
            throw new AppException("Failed to parse Claude API response: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            throw new AppException("Unexpected error parsing Claude response: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Extracts the JSON array from Claude's response text, stripping any markdown code fences if present.
     */
    private String extractJsonArray(String text) {
        String trimmed = text.trim();

        // Strip markdown code block if present (```json ... ``` or ``` ... ```)
        if (trimmed.startsWith("```")) {
            int start = trimmed.indexOf('\n');
            int end = trimmed.lastIndexOf("```");
            if (start >= 0 && end > start) {
                trimmed = trimmed.substring(start + 1, end).trim();
            }
        }

        // Find first '[' and last ']' to isolate the array
        int arrayStart = trimmed.indexOf('[');
        int arrayEnd = trimmed.lastIndexOf(']');
        if (arrayStart >= 0 && arrayEnd > arrayStart) {
            trimmed = trimmed.substring(arrayStart, arrayEnd + 1);
        }

        return trimmed;
    }
}
