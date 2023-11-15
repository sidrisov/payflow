package ua.sinaver.web3.message;

public record AccountMessage(String address, Integer network, boolean safe) {
}
