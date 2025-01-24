package ua.sinaver.web3.payflow.dto;

import ua.sinaver.web3.payflow.entity.Wallet;

public record WalletMessage(
		String address, int network,
		String version, boolean deployed) {

	public static WalletMessage from(Wallet wallet) {
		return new WalletMessage(
				wallet.getAddress(),
				wallet.getNetwork(),
				wallet.getWalletVersion(),
				wallet.isDeployed());
	}

	public Wallet toEntity() {
		return new Wallet(
				address,
				network,
				version,
				deployed);
	}

}
