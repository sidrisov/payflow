package ua.sinaver.web3.message;

import ua.sinaver.web3.data.Wallet;

public record WalletMessage(
        String address, Integer network,
        boolean smart,
        boolean safe, String safeVersion, String safeSaltNonce,
        boolean safeDeployed, String master) {

    public static WalletMessage convert(Wallet wallet) {
        return new WalletMessage(wallet.getAddress(), wallet.getNetwork(), wallet.isSmart(), wallet.isSafe(),
                wallet.getSafeVersion(), wallet.getSafeSaltNonce(), wallet.isSafeDeployed(),
                wallet.isSmart() && wallet.getMaster() != null ? wallet.getMaster().getAddress() : null);
    }

    public static Wallet convert(WalletMessage walletDto) {
        return new Wallet(walletDto.address(), walletDto.network(), walletDto.safe(), walletDto.smart(),
                walletDto.safeVersion(), walletDto.safeSaltNonce(), walletDto.safeDeployed());
    }

}
