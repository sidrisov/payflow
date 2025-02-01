package ua.sinaver.web3.payflow.message.agent;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

import java.util.List;

@Builder
@Value
public class AgentRequest {
    String model;
    @JsonProperty("max_tokens")
    int maxTokens;
    @Builder.Default
    Double temperature = 1.0;
    List<AgentSystemMessage> system;
    List<AgentTool> tools;
    List<AgentMessage> messages;
}
