package ua.sinaver.web3.payflow.message.farcaster.neynar;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.UUID;

public record NotificationRequest(
    Notification notification,
    @JsonProperty("target_fids")
    List<Integer> targetFids
) {
    public record Notification(
        String title,
        String body,
        @JsonProperty("target_url")
        String targetUrl,
        String uuid
    ) {
        public static Notification create(String title, String body, String targetUrl) {
            return new Notification(title, body, targetUrl, UUID.randomUUID().toString());
        }
    }
}
