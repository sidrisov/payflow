package ua.sinaver.web3.message;

public record SiweChallengeMessage(SiweMessage message, String signature) {
}
