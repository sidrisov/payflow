package ua.sinaver.web3.message;

public record WalletMessage(String address, String network, boolean smart, String master) {
}
