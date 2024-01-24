package ua.sinaver.web3.payflow.message;

import ua.sinaver.web3.payflow.data.Wallet;

public record WalletMessage(
		String address, int network,
		String version, boolean deployed) {

	public static WalletMessage convert(Wallet wallet) {
		return new WalletMessage(wallet.getAddress(), wallet.getNetwork(),
				wallet.getWalletVersion(), wallet.isDeployed());
	}

	public static Wallet convert(WalletMessage walletDto) {
		return new Wallet(walletDto.address(), walletDto.network(),
				walletDto.version(), walletDto.deployed());
	}

}
