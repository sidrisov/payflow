package ua.sinaver.web3.message;

public record WalletMessage(
                String address, String network,
                boolean smart,
                boolean safe, String safeVersion, String safeSaltNonce,
                boolean safeDeployed, String master) {
}
