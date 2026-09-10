package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.AiModelsResponseDTO;
import com.example.foodach.DTO.ChatMessageDTO;
import com.example.foodach.DTO.ChatRequestDTO;
import com.example.foodach.DTO.ChatResponseDTO;
import com.example.foodach.Service.AiAdviceService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiAdviceServiceImpl implements AiAdviceService {

    private final String provider;
    private final String baseUrl;
    private final String apiKey;
    private final String defaultModel;
    private final List<String> selectableModels;
    private final int maxTokens;
    private final int timeoutSeconds;
    private final String systemPrompt;

    public AiAdviceServiceImpl(
            @Value("${app.ai.provider:openai}") String provider,
            @Value("${app.ai.base-url:https://generativelanguage.googleapis.com/v1beta/openai/chat/completions}") String baseUrl,
            @Value("${app.ai.api-key:}") String apiKey,
            @Value("${app.ai.default-model:gemini-2.5-flash}") String defaultModel,
            @Value("${app.ai.selectable-models:gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash}") List<String> selectableModels,
            @Value("${app.ai.max-tokens:600}") int maxTokens,
            @Value("${app.ai.timeout-seconds:60}") int timeoutSeconds,
            @Value("${app.ai.system-prompt:}") String systemPrompt) {
        this.provider = provider;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.defaultModel = defaultModel;
        this.selectableModels = selectableModels;
        this.maxTokens = maxTokens;
        this.timeoutSeconds = timeoutSeconds;
        this.systemPrompt = systemPrompt;
    }

    @Override
    public ChatResponseDTO chat(ChatRequestDTO chatRequestDTO) {
        String model = chatRequestDTO.model() == null || chatRequestDTO.model().isBlank()
                ? defaultModel
                : chatRequestDTO.model();
        if (selectableModels != null && !selectableModels.isEmpty() && !selectableModels.contains(model)) {
            model = defaultModel;
        }

        List<ChatMessageDTO> messages = withSystemPrompt(chatRequestDTO.messages());

        if (messages.isEmpty()) {
            throw new IllegalArgumentException("No message provided");
        }

        if (apiKey == null || apiKey.isBlank()) {
            return demoReply(model, messages.get(messages.size() - 1).content(), provider);
        }

        return callProvider(model, messages);
    }

    @Override
    public AiModelsResponseDTO getAvailableModels() {
        return new AiModelsResponseDTO(defaultModel, selectableModels);
    }

    private List<ChatMessageDTO> withSystemPrompt(List<ChatMessageDTO> messages) {
        if (messages == null) {
            return List.of();
        }

        boolean hasSystem = messages.stream().anyMatch(msg -> "system".equals(msg.role()));
        if (hasSystem) {
            return messages;
        }

        List<ChatMessageDTO> result = new ArrayList<>();
        result.add(new ChatMessageDTO("system", systemPrompt.isBlank()
                ? "You are the AgriConnect farming advisor. Give clear, practical, and concise advice "
                  + "about crops, soil, irrigation, pests, livestock, and agricultural markets. "
                  + "If unsure, say so and suggest consulting a local agronomist."
                : systemPrompt));
        result.addAll(messages);
        return result;
    }

    private ChatResponseDTO callProvider(String model, List<ChatMessageDTO> messages) {
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory();
        requestFactory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));

        RestClient.Builder builder = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);

        if ("gemini".equalsIgnoreCase(provider)) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);
        } else {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);
        }

        RestClient restClient = builder.build();

        List<Map<String, String>> payloadMessages = messages.stream()
                .map(msg -> Map.of("role", "system".equals(msg.role()) ? "system" : msg.role(), "content", msg.content()))
                .collect(Collectors.toList());

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", payloadMessages,
                "max_tokens", maxTokens
        );

        ApiResponse response;
        try {
            response = restClient.post()
                    .body(requestBody)
                    .retrieve()
                    .body(ApiResponse.class);
        } catch (Exception ex) {
            throw new RuntimeException("AI request to " + provider + " failed: " + rootMessage(ex));
        }

        if (response == null || response.choices() == null || response.choices().isEmpty()) {
            throw new RuntimeException("AI provider returned an empty response");
        }

        String reply = response.choices().get(0).message().content();
        if (reply == null || reply.isBlank()) {
            throw new RuntimeException("AI provider returned an empty answer");
        }
        return new ChatResponseDTO(model, reply);
    }

    private String rootMessage(Throwable ex) {
        Throwable current = ex;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        String msg = current.getMessage();
        return msg == null ? current.getClass().getSimpleName() : msg.replaceAll("\\s+", " ").trim();
    }

    private ChatResponseDTO demoReply(String model, String userMessage, String providerName) {
        String reply = """
            [Setup required] Your AgriConnect backend is connected and the request was received, but no %s API key is configured yet.

            You asked: "%s"

            To enable real AI answers:
              1. Get a free key: https://aistudio.google.com/apikey (Google AI Studio)
              2. Set app.ai.api-key in backend/src/main/resources/application.properties
              3. Restart the backend
            The chat, models list, and request flow all work already — only the answer needs the key.

            As your AgriConnect farming advisor I can then help with crops, soil, pests, irrigation, and market prices.
            """.formatted(providerName, userMessage);
        return new ChatResponseDTO(model, reply);
    }

    private record ApiResponse(List<Choice> choices) {}
    private record Choice(Message message) {}
    private record Message(String role, String content) {}
}