package ua.sinaver.web3.payflow.message.farcaster;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Value;

@Value
public class Conversation {
    @JsonProperty("conversation")
    ConversationData data;

    @Value
    public static class ConversationData {
        CastMessage parent;
        CastMessage current;
    }

    @Value
    public static class CastMessage {
        User author;
        String text;
        List<User> mentionedUsers;
    }

    @Value
    public static class User {
        String username;
        Integer fid;
    }
}
