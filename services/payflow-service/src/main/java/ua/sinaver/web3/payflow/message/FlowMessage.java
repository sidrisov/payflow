package ua.sinaver.web3.payflow.message;

import lombok.val;
import ua.sinaver.web3.payflow.data.Flow;
import ua.sinaver.web3.payflow.data.User;

import java.util.List;

public record FlowMessage(String owner, String title, String description, String uuid,
                          String walletProvider,
                          String saltNonce, List<WalletMessage> wallets) {
	public static FlowMessage convert(Flow flow, User user) {
		val wallets = flow.getWallets().stream().map(w -> WalletMessage.convert(w))
				.toList();
		return new FlowMessage(user != null ? (user.getSigner() != null ? user.getSigner() : user.getIdentity()) : null,
				flow.getTitle(), flow.getDescription(),
				flow.getUuid(),
				flow.getWalletProvider(), flow.getSaltNonce(), wallets);
	}

	public static Flow convert(FlowMessage flowMessage, User user) {
		val flow = new Flow(user.getId(), flowMessage.title(), flowMessage.description(), flowMessage.walletProvider(),
				flowMessage.saltNonce());
		val wallets = flowMessage.wallets().stream().map(w -> {
			val wallet = WalletMessage.convert(w);
			wallet.setFlow(flow);
			return wallet;
		}).toList();
		flow.setWallets(wallets);
		return flow;
	}
}
