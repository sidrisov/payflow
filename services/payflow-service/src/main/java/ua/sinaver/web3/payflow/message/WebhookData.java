package ua.sinaver.web3.payflow.message;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record WebhookData(@JsonProperty("created_at") long createdAt,
                          String type,
                          Data data) {
    @Override
    public String toString() {
        return "WebhookData{" +
                "createdAt=" + createdAt +
                ", type='" + type + '\'' +
                ", data=" + data +
                '}';
    }

    public record Data(
            String object,
            String hash,
            @JsonProperty("thread_hash") String threadHash,
            @JsonProperty("parent_hash") String parentHash,
            @JsonProperty("parent_url") String parentUrl,
            @JsonProperty("root_parent_url") String rootParentUrl,
            @JsonProperty("parent_author") Author parentAuthor,
            Author author,
            String text,
            String timestamp,
            List<Object> embeds,
            Reactions reactions,
            Replies replies,
            @JsonProperty("mentioned_profiles") List<MentionedProfile> mentionedProfiles
    ) {
        @Override
        public String toString() {
            return "Data{" +
                    "object='" + object + '\'' +
                    ", hash='" + hash + '\'' +
                    ", threadHash='" + threadHash + '\'' +
                    ", parentHash='" + parentHash + '\'' +
                    ", parentUrl='" + parentUrl + '\'' +
                    ", rootParentUrl='" + rootParentUrl + '\'' +
                    ", parentAuthor=" + parentAuthor +
                    ", author=" + author +
                    ", text='" + text + '\'' +
                    ", timestamp='" + timestamp + '\'' +
                    ", embeds=" + embeds +
                    ", reactions=" + reactions +
                    ", replies=" + replies +
                    ", mentionedProfiles=" + mentionedProfiles +
                    '}';
        }
    }

    public record Author(
            String object,
            int fid,
            @JsonProperty("custody_address") String custodyAddress,
            String username,
            @JsonProperty("display_name") String displayName,
            @JsonProperty("pfp_url") String pfpUrl,
            Profile profile,
            @JsonProperty("follower_count") int followerCount,
            @JsonProperty("following_count") int followingCount,
            List<String> verifications,
            @JsonProperty("verified_addresses") VerifiedAddresses verifiedAddresses,
            @JsonProperty("active_status") String activeStatus,
            @JsonProperty("power_badge") boolean powerBadge
    ) {
        @Override
        public String toString() {
            return "Author{" +
                    "object='" + object + '\'' +
                    ", fid=" + fid +
                    ", custodyAddress='" + custodyAddress + '\'' +
                    ", username='" + username + '\'' +
                    ", displayName='" + displayName + '\'' +
                    ", pfpUrl='" + pfpUrl + '\'' +
                    ", profile=" + profile +
                    ", followerCount=" + followerCount +
                    ", followingCount=" + followingCount +
                    ", verifications=" + verifications +
                    ", verifiedAddresses=" + verifiedAddresses +
                    ", activeStatus='" + activeStatus + '\'' +
                    ", powerBadge=" + powerBadge +
                    '}';
        }
    }

    public record Profile(@JsonProperty("bio") Bio bio) {
        @Override
        public String toString() {
            return "Profile{" +
                    "bio=" + bio +
                    '}';
        }
    }

    public record Bio(
            String text,
            @JsonProperty("mentioned_profiles") List<Object> mentionedProfiles
    ) {
        @Override
        public String toString() {
            return "Bio{" +
                    "text='" + text + '\'' +
                    ", mentionedProfiles=" + mentionedProfiles +
                    '}';
        }
    }

    public record VerifiedAddresses(
            @JsonProperty("eth_addresses") List<String> ethAddresses,
            @JsonProperty("sol_addresses") List<String> solAddresses) {
        @Override
        public String toString() {
            return "VerifiedAddresses{" +
                    "ethAddresses=" + ethAddresses +
                    ", solAddresses=" + solAddresses +
                    '}';
        }
    }

    public record Reactions(
            @JsonProperty("likes_count") int likesCount,
            @JsonProperty("recasts_count") int recastsCount,
            List<Object> likes,
            List<Object> recasts
    ) {
        @Override
        public String toString() {
            return "Reactions{" +
                    "likesCount=" + likesCount +
                    ", recastsCount=" + recastsCount +
                    ", likes=" + likes +
                    ", recasts=" + recasts +
                    '}';
        }
    }

    public record Replies(
            int count
    ) {
        @Override
        public String toString() {
            return "Replies{" +
                    "count=" + count +
                    '}';
        }
    }

    public record MentionedProfile(
            String object,
            int fid,
            @JsonProperty("custody_address") String custodyAddress,
            String username,
            @JsonProperty("display_name") String displayName,
            @JsonProperty("pfp_url") String pfpUrl,
            Profile profile,
            @JsonProperty("follower_count") int followerCount,
            @JsonProperty("following_count") int followingCount,
            List<String> verifications,
            @JsonProperty("verified_addresses") VerifiedAddresses verifiedAddresses,
            @JsonProperty("active_status") String activeStatus,
            @JsonProperty("power_badge") boolean powerBadge
    ) {
        @Override
        public String toString() {
            return "MentionedProfile{" +
                    "object='" + object + '\'' +
                    ", fid=" + fid +
                    ", custodyAddress='" + custodyAddress + '\'' +
                    ", username='" + username + '\'' +
                    ", displayName='" + displayName + '\'' +
                    ", pfpUrl='" + pfpUrl + '\'' +
                    ", profile=" + profile +
                    ", followerCount=" + followerCount +
                    ", followingCount=" + followingCount +
                    ", verifications=" + verifications +
                    ", verifiedAddresses=" + verifiedAddresses +
                    ", activeStatus='" + activeStatus + '\'' +
                    ", powerBadge=" + powerBadge +
                    '}';
        }
    }
}
