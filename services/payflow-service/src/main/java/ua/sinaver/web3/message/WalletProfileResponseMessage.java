package ua.sinaver.web3.message;

public record WalletProfileResponseMessage(String address, int network, ProfileMetaMessage profile) {
}
