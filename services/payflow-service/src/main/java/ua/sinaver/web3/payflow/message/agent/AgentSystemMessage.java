package ua.sinaver.web3.payflow.message.agent;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

import java.util.Map;

@Builder
@Value
public class AgentSystemMessage {
    String type;
    String text;
    @JsonProperty("cache_control")
    @Builder.Default
    Map<String, String> cacheControl = Map.of("type", "ephemeral");
}
