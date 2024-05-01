package ua.sinaver.web3.payflow.data.webhooks;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record WebhookData(@JsonProperty("created_at") long createdAt,
                          @JsonProperty("type") String type,
                          @JsonProperty("data") Data data) {
    @Override
    public String toString() {
        return "WebhookData{" +
                "createdAt=" + createdAt +
                ", type='" + type + '\'' +
                ", data=" + data +
                '}';
    }

    public record Data(
            @JsonProperty("object") String object,
            @JsonProperty("hash") String hash,
            @JsonProperty("thread_hash") String threadHash,
            @JsonProperty("parent_hash") String parentHash,
            @JsonProperty("parent_url") String parentUrl,
            @JsonProperty("root_parent_url") String rootParentUrl,
            @JsonProperty("parent_author") Author parentAuthor,
            @JsonProperty("author") Author author,
            @JsonProperty("text") String text,
            @JsonProperty("timestamp") String timestamp,
            @JsonProperty("embeds") List<Object> embeds,
            @JsonProperty("reactions") Reactions reactions,
            @JsonProperty("replies") Replies replies,
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
            @JsonProperty("object") String object,
            @JsonProperty("fid") int fid,
            @JsonProperty("custody_address") String custodyAddress,
            @JsonProperty("username") String username,
            @JsonProperty("display_name") String displayName,
            @JsonProperty("pfp_url") String pfpUrl,
            @JsonProperty("profile") Profile profile,
            @JsonProperty("follower_count") int followerCount,
            @JsonProperty("following_count") int followingCount,
            @JsonProperty("verifications") List<String> verifications,
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
            @JsonProperty("text") String text,
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
            @JsonProperty("likes") List<Object> likes,
            @JsonProperty("recasts") List<Object> recasts
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
            @JsonProperty("count") int count
    ) {
        @Override
        public String toString() {
            return "Replies{" +
                    "count=" + count +
                    '}';
        }
    }

    public record MentionedProfile(
            @JsonProperty("object") String object,
            @JsonProperty("fid") int fid,
            @JsonProperty("custody_address") String custodyAddress,
            @JsonProperty("username") String username,
            @JsonProperty("display_name") String displayName,
            @JsonProperty("pfp_url") String pfpUrl,
            @JsonProperty("profile") Profile profile,
            @JsonProperty("follower_count") int followerCount,
            @JsonProperty("following_count") int followingCount,
            @JsonProperty("verifications") List<String> verifications,
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
