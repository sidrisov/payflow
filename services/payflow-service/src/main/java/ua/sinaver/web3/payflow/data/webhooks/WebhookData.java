package ua.sinaver.web3.payflow.data.webhooks;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class WebhookData {
    @JsonProperty("created_at")
    private long createdAt;

    public long getCreatedAt() {
        return createdAt;
    }

    public String getType() {
        return type;
    }

    public Data getData() {
        return data;
    }

    @JsonProperty("type")
    private String type;

    @JsonProperty("data")
    private Data data;

    // Getters and setters

    @Override
    public String toString() {
        return "WebhookData{" +
                "createdAt=" + createdAt +
                ", type='" + type + '\'' +
                ", data=" + data +
                '}';
    }

    public static class Data {
        @JsonProperty("object")
        private String object;

        public String getObject() {
            return object;
        }

        public String getHash() {
            return hash;
        }

        public String getThreadHash() {
            return threadHash;
        }

        public String getParentHash() {
            return parentHash;
        }

        public String getParentUrl() {
            return parentUrl;
        }

        public String getRootParentUrl() {
            return rootParentUrl;
        }

        public Author getParentAuthor() {
            return parentAuthor;
        }

        public Author getAuthor() {
            return author;
        }

        public String getText() {
            return text;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public List<Object> getEmbeds() {
            return embeds;
        }

        public Reactions getReactions() {
            return reactions;
        }

        public Replies getReplies() {
            return replies;
        }

        public List<MentionedProfile> getMentionedProfiles() {
            return mentionedProfiles;
        }

        @JsonProperty("hash")
        private String hash;

        @JsonProperty("thread_hash")
        private String threadHash;

        @JsonProperty("parent_hash")
        private String parentHash;

        @JsonProperty("parent_url")
        private String parentUrl;

        @JsonProperty("root_parent_url")
        private String rootParentUrl;

        @JsonProperty("parent_author")
        private Author parentAuthor;

        @JsonProperty("author")
        private Author author;

        @JsonProperty("text")
        private String text;

        @JsonProperty("timestamp")
        private String timestamp;

        @JsonProperty("embeds")
        private List<Object> embeds;

        @JsonProperty("reactions")
        private Reactions reactions;

        @JsonProperty("replies")
        private Replies replies;

        @JsonProperty("mentioned_profiles")
        private List<MentionedProfile> mentionedProfiles;
        // Getters and setters

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

    public static class Author {
        @JsonProperty("object")
        private String object;

        public String getObject() {
            return object;
        }

        public int getFid() {
            return fid;
        }

        public String getCustodyAddress() {
            return custodyAddress;
        }

        public String getUsername() {
            return username;
        }

        public String getDisplayName() {
            return displayName;
        }

        public String getPfpUrl() {
            return pfpUrl;
        }

        public Profile getProfile() {
            return profile;
        }

        public int getFollowerCount() {
            return followerCount;
        }

        public int getFollowingCount() {
            return followingCount;
        }

        public List<String> getVerifications() {
            return verifications;
        }

        public VerifiedAddresses getVerifiedAddresses() {
            return verifiedAddresses;
        }

        public String getActiveStatus() {
            return activeStatus;
        }

        public boolean isPowerBadge() {
            return powerBadge;
        }

        @JsonProperty("fid")
        private int fid;

        @JsonProperty("custody_address")
        private String custodyAddress;

        @JsonProperty("username")
        private String username;

        @JsonProperty("display_name")
        private String displayName;

        @JsonProperty("pfp_url")
        private String pfpUrl;

        @JsonProperty("profile")
        private Profile profile;

        @JsonProperty("follower_count")
        private int followerCount;

        @JsonProperty("following_count")
        private int followingCount;

        @JsonProperty("verifications")
        private List<String> verifications;

        @JsonProperty("verified_addresses")
        private VerifiedAddresses verifiedAddresses;

        @JsonProperty("active_status")
        private String activeStatus;

        @JsonProperty("power_badge")
        private boolean powerBadge;

        // Getters and setters

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

    public static class Profile {
        @JsonProperty("bio")
        private Bio bio;

        public Bio getBio() {
            return bio;
        }
// Getters and setters

        @Override
        public String toString() {
            return "Profile{" +
                    "bio=" + bio +
                    '}';
        }
    }

    public static class Bio {
        public String getText() {
            return text;
        }

        public List<Object> getMentionedProfiles() {
            return mentionedProfiles;
        }

        @JsonProperty("text")
        private String text;

        @JsonProperty("mentioned_profiles")
        private List<Object> mentionedProfiles;

        // Getters and setters

        @Override
        public String toString() {
            return "Bio{" +
                    "text='" + text + '\'' +
                    ", mentionedProfiles=" + mentionedProfiles +
                    '}';
        }
    }

    public static class VerifiedAddresses {
        public List<String> getEthAddresses() {
            return ethAddresses;
        }

        public List<String> getSolAddresses() {
            return solAddresses;
        }

        @JsonProperty("eth_addresses")
        private List<String> ethAddresses;

        @JsonProperty("sol_addresses")
        private List<String> solAddresses;

        // Getters and setters

        @Override
        public String toString() {
            return "VerifiedAddresses{" +
                    "ethAddresses=" + ethAddresses +
                    ", solAddresses=" + solAddresses +
                    '}';
        }
    }

    public static class Reactions {
        public int getLikesCount() {
            return likesCount;
        }

        public int getRecastsCount() {
            return recastsCount;
        }

        public List<Object> getLikes() {
            return likes;
        }

        public List<Object> getRecasts() {
            return recasts;
        }

        @JsonProperty("likes_count")
        private int likesCount;

        @JsonProperty("recasts_count")
        private int recastsCount;

        @JsonProperty("likes")
        private List<Object> likes;

        @JsonProperty("recasts")
        private List<Object> recasts;

        // Getters and setters

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

    public static class Replies {
        @JsonProperty("count")
        private int count;

        // Getters and setters

        public int getCount() {
            return count;
        }

        @Override
        public String toString() {
            return "Replies{" +
                    "count=" + count +
                    '}';
        }
    }

    public static class MentionedProfile {
        @JsonProperty("object")
        private String object;

        @JsonProperty("fid")
        private int fid;

        @JsonProperty("custody_address")
        private String custodyAddress;

        @JsonProperty("username")
        private String username;

        @JsonProperty("display_name")
        private String displayName;

        @JsonProperty("pfp_url")
        private String pfpUrl;

        @JsonProperty("profile")
        private Profile profile;

        @JsonProperty("follower_count")
        private int followerCount;

        @JsonProperty("following_count")
        private int followingCount;

        @JsonProperty("verifications")
        private List<String> verifications;

        public String getObject() {
            return object;
        }

        public int getFid() {
            return fid;
        }

        public String getCustodyAddress() {
            return custodyAddress;
        }

        public String getUsername() {
            return username;
        }

        public String getDisplayName() {
            return displayName;
        }

        public String getPfpUrl() {
            return pfpUrl;
        }

        public Profile getProfile() {
            return profile;
        }

        public int getFollowerCount() {
            return followerCount;
        }

        public int getFollowingCount() {
            return followingCount;
        }

        public List<String> getVerifications() {
            return verifications;
        }

        public VerifiedAddresses getVerifiedAddresses() {
            return verifiedAddresses;
        }

        public String getActiveStatus() {
            return activeStatus;
        }

        public boolean isPowerBadge() {
            return powerBadge;
        }

        @JsonProperty("verified_addresses")
        private VerifiedAddresses verifiedAddresses;

        @JsonProperty("active_status")
        private String activeStatus;

        @JsonProperty("power_badge")
        private boolean powerBadge;

        // Getters and setters

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
