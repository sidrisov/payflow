package ua.sinaver.web3.payflow.message.farcaster.frames;

public record FrameEventPayload(
                FrameEventType event,
                NotificationDetails notificationDetails) {
        public record NotificationDetails(
                        String url,
                        String token) {
        }

        public enum FrameEventType {
                FRAME_ADDED("frame_added"),
                FRAME_REMOVED("frame_removed"),
                NOTIFICATIONS_DISABLED("notifications_disabled"),
                NOTIFICATIONS_ENABLED("notifications_enabled");

                private final String value;

                FrameEventType(String value) {
                        this.value = value;
                }

                public String getValue() {
                        return value;
                }
        }
}
