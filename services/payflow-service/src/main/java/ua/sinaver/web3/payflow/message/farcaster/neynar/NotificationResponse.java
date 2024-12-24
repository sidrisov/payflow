package ua.sinaver.web3.payflow.message.farcaster.neynar;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record NotificationResponse(
        @JsonProperty("notification_deliveries") List<NotificationDelivery> notificationDeliveries) {
    public record NotificationDelivery(
            String object,
            Long fid,
            String status) {
    }
}
