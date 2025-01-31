package ua.sinaver.web3.payflow.message.farcaster;

import java.util.List;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record CastConversationData(Conversation conversation) {

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static record Conversation(Cast cast, List<Cast> chronologicalParentCasts) {
    }

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static record Cast(
            FarcasterUser author,
            String timestamp,
            String text,
            List<FarcasterUser> mentionedProfiles,
            List<Cast> directReplies) {
    }

}
