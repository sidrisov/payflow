package ua.sinaver.web3.payflow.message.agent;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

import java.util.List;
import java.util.Map;

@Builder
@Value
public class AgentResponse {
    String id;
    String type;
    String role;
    String model;
    List<Content> content;
    @JsonProperty("stop_reason")
    String stopReason;
    @JsonProperty("stop_sequence")
    String stopSequence;
    Usage usage;

    @Builder
    @Value
    public static class Content {
        String type;
        String text;
        String id;
        String name;
        Map<String, Object> input;
    }

    @Builder
    @Value
    public static class Usage {
        @JsonProperty("input_tokens")
        int inputTokens;
        @JsonProperty("cache_creation_input_tokens")
        int cacheCreationInputTokens;
        @JsonProperty("cache_read_input_tokens")
        int cacheReadInputTokens;
        @JsonProperty("output_tokens")
        int outputTokens;
    }
}
