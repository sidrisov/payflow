package ua.sinaver.web3.payflow.message;

public record ProfileMetaMessage(String identity, String displayName, String username,
                                 String profileImage,
                                 String createdDate, FlowMessage defaultFlow) {
}