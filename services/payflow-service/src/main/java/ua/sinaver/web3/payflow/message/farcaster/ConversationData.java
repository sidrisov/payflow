package ua.sinaver.web3.payflow.message.farcaster;

import java.util.List;

import lombok.Value;

@Value
public class ConversationData {
    Conversation conversation;

    @Value
    public static class Conversation {
        Cast cast;
        List<Cast> chronologicalParentCasts;
    }

    @Value
    public static class Cast {
        User author;
        String text;
        List<User> mentionedProfiles;
        List<Cast> directReplies;
    }

    @Value
    public static class User {
        Integer fid;
        String username;
        String displayName;
    }
}
