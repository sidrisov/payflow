package ua.sinaver.web3.message;

public record AccountMessage(String address, int network, boolean safe) {
}
