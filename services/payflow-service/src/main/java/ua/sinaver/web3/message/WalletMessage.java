package ua.sinaver.web3.message;

public record WalletMessage(String address, String network, boolean smart, boolean safe, String safeVersion,
        boolean safeDeployed, String master) {
}
