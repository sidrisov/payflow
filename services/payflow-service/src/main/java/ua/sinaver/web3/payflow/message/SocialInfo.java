package ua.sinaver.web3.payflow.message;

public record SocialInfo(String dappName, String profileName, String profileDisplayName,
                         Integer profileId, String profileImage, Integer followerCount) {
}
