package ua.sinaver.web3.payflow.message;

import lombok.val;
import ua.sinaver.web3.payflow.data.Flow;
import ua.sinaver.web3.payflow.data.User;

import java.util.List;

public record FlowMessage(String owner, String title, String description, String uuid,
                          String walletProvider,
                          String saltNonce, List<WalletMessage> wallets) {
	public static String getFlowSigner(Flow flow, User user) {
		// required only because when we don't want to return flow signer info
		if (user == null) {
			return null;
		}

		// return flow specific signer
		if (flow.getSigner() != null) {
			return flow.getSigner();
		}

		// if not specified fallback to default user's signer, otherwise return identity
		if (user.getSigner() != null) {
			return user.getSigner();
		} else {
			return user.getIdentity();
		}
	}

	public static String getFlowSigner(FlowMessage flow, User user) {
		// return flow specific signer
		if (flow.owner() != null) {
			return flow.owner();
		}

		// if not specified fallback to default user's signer, otherwise return identity
		if (user.getSigner() != null) {
			return user.getSigner();
		} else {
			return user.getIdentity();
		}
	}

	public static FlowMessage convert(Flow flow, User user) {
		// still try fetch, since old flows were without signer field
		val flowSigner = getFlowSigner(flow, user);
		val wallets = flow.getWallets().stream().map(WalletMessage::convert)
				.toList();
		return new FlowMessage(flowSigner,
				flow.getTitle(), flow.getDescription(),
				flow.getUuid(),
				flow.getWalletProvider(), flow.getSaltNonce(), wallets);
	}

	public static Flow convert(FlowMessage flowMessage, User user) {
		val flowSigner = getFlowSigner(flowMessage, user);
		val flow = new Flow(user.getId(), flowMessage.title(), flowMessage.description(),
				flowSigner, flowMessage.walletProvider(),
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
