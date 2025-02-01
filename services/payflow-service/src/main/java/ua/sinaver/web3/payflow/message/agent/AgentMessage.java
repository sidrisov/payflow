package ua.sinaver.web3.payflow.message.agent;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Builder
@Value
public class AgentMessage {
    String role;
    List<Content> content;

    @Builder
    @Value
    public static class Content {
        String type;
        String text;
    }
}
