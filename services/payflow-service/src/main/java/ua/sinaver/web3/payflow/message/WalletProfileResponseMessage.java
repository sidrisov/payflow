package ua.sinaver.web3.payflow.message;

public record WalletProfileResponseMessage(String address, int network,
                                           ProfileMetaMessage profile) {
}
