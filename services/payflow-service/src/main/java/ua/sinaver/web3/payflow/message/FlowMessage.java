package ua.sinaver.web3.payflow.message;

import lombok.val;
import ua.sinaver.web3.payflow.data.Flow;
import ua.sinaver.web3.payflow.data.User;

import java.util.List;

public record FlowMessage(String signer, String signerProvider, String title,
                          String type,
                          String uuid,
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

	public static String getFlowSignerProvider(Flow flow, User user) {
		// required only because when we don't want to return flow signer info
		if (user == null) {
			return null;
		}

		return flow.getSignerProvider();
	}

	public static String getFlowSigner(FlowMessage flow, User user) {
		// return flow specific signer
		if (flow.signer() != null) {
			return flow.signer();
		}

		// if not specified fallback to default user's signer, otherwise return identity
		if (user.getSigner() != null) {
			return user.getSigner();
		} else {
			return user.getIdentity();
		}
	}

	public static String getFlowSignerProvider(FlowMessage flow) {
		if (flow.signerProvider() != null) {
			return flow.signerProvider();
		}

		return null;
	}

	public static FlowMessage convert(Flow flow, User user) {
		// still try fetch, since old flows were without signer field
		val flowSigner = user != null ? getFlowSigner(flow, user) : null;
		val flowSignerProvider = user != null ? getFlowSignerProvider(flow, user) : null;

		val wallets = flow.getWallets().stream().map(WalletMessage::convert)
				.toList();
		return new FlowMessage(flowSigner, flowSignerProvider,
				flow.getTitle(),
				flow.getType() != null ? flow.getType().toString() : "",
				flow.getUuid(),
				flow.getWalletProvider(), flow.getSaltNonce(), wallets);
	}

	public static Flow convert(FlowMessage flowMessage, User user) {
		val flowSigner = getFlowSigner(flowMessage, user);
		val flowSignerProvider = getFlowSignerProvider(flowMessage);

		val flow = new Flow(user.getId(), flowMessage.title(),
				flowSigner, flowSignerProvider, flowMessage.walletProvider(),
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
