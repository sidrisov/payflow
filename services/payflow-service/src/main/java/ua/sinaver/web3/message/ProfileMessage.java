package ua.sinaver.web3.message;

public record ProfileMessage(String displayName, String username, String profileImage, String address,
        FlowMessage defaultFlow) {
}
