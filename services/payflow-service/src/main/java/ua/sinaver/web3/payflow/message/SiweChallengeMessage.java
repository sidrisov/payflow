package ua.sinaver.web3.payflow.message;

public record SiweChallengeMessage(SiweMessage message, String signature) {
}
