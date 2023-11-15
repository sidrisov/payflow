package ua.sinaver.web3.message;

public record WalletProfileResponseMessage(String address, Integer network, ProfileMetaMessage profile) {
}
