package ua.sinaver.web3.payflow.message.agent;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

import java.util.List;
import java.util.Map;

@Builder
@Value
public class AgentTool {
    String name;
    String description;
    @JsonProperty("input_schema")
    InputSchema inputSchema;
    @JsonProperty("cache_control")
    Map<String, String> cacheControl;

    @Builder
    @Value
    public static class InputSchema {
        String type;
        @Builder.Default
        Map<String, Property> properties = Map.of();
        @Builder.Default
        List<String> required = List.of();

        @Builder
        @Value
        public static class Property {
            String type;
            String description;
            Items items;
        }

        @Builder
        @Value
        public static class Items {
            String type;
            @Builder.Default
            Map<String, Property> properties = Map.of();
            @Builder.Default
            List<String> required = List.of();
        }
    }
}
