package ua.sinaver.web3.payflow.message;

public record AccountMessage(String address, int network, boolean safe) {
}
