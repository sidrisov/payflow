package ua.sinaver.web3.payflow.message;

public record SocialInfo(String dappName, String profileName, String profileDisplayName,
                         String profileImage, int followerCount, boolean isFarcasterPowerUser) {
}
