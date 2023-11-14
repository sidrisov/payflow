package ua.sinaver.web3.message;

public record WalletProfileResponseMessage(String address, String network, ProfileMetaMessage profile) {
}
