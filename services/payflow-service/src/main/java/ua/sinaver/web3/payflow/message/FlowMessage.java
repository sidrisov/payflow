package ua.sinaver.web3.payflow.message;

import lombok.val;
import ua.sinaver.web3.payflow.data.Flow;
import ua.sinaver.web3.payflow.data.User;

import java.util.List;

import static ua.sinaver.web3.payflow.service.TokenService.SUPPORTED_FRAME_PAYMENTS_CHAIN_IDS;
import static ua.sinaver.web3.payflow.service.WalletService.shortenWalletAddressLabel2;

public record FlowMessage(String signer, String signerProvider,
                          String signerType, String signerCredential,
                          String title,
                          String type,
                          String uuid,
                          String walletProvider,
                          String saltNonce, List<WalletMessage> wallets,
                          boolean archived) {
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
		if (flow.signer != null) {
			return flow.signer;
		}

		// if not specified fallback to default user's signer, otherwise return identity
		if (user.getSigner() != null) {
			return user.getSigner();
		} else {
			return user.getIdentity();
		}
	}

	public static String getFlowSignerProvider(FlowMessage flow) {
		if (flow.signerProvider != null) {
			return flow.signerProvider;
		}

		return null;
	}

	public static FlowMessage convert(Flow flow, User user, boolean signerInfo) {
		// still try fetch, since old flows were without signer field
		val flowSigner = signerInfo && user != null ? getFlowSigner(flow, user) : null;
		val flowSignerProvider = signerInfo && user != null ? getFlowSignerProvider(flow, user) : null;
		val flowSignerType = signerInfo && user != null ? flow.getSignerType() : null;
		val flowSignerCredential = signerInfo && user != null ? flow.getSignerCredential() : null;


		val wallets = flow.getWallets().stream()
				//.filter(w -> !w.isDisabled())
				.map(WalletMessage::convert)
				.toList();
		return new FlowMessage(flowSigner, flowSignerProvider,
				flowSignerType, flowSignerCredential,
				flow.getTitle(),
				flow.getType() != null ? flow.getType().toString() : "",
				flow.getUuid(),
				flow.getWalletProvider(), flow.getSaltNonce(), wallets,
				flow.isArchived() || flow.isDisabled());
	}

	public static FlowMessage convertFarcasterVerification(String verificationAddress, User user) {
		val wallets = SUPPORTED_FRAME_PAYMENTS_CHAIN_IDS.stream()
				.map(chainId -> new WalletMessage(verificationAddress, chainId, null, true))
				.toList();
		return new FlowMessage(verificationAddress, null,
				null, null,
				shortenWalletAddressLabel2(verificationAddress),
				Flow.FlowType.FARCASTER_VERIFICATION.toString(),
				verificationAddress,
				null, null, wallets,
				false);
	}

	public static FlowMessage convertDefaultFlow(User user, boolean signerInfo) {
		return user.getDefaultFlow() != null ? FlowMessage.convert(user.getDefaultFlow(),
				user, signerInfo)
				: (user.getDefaultReceivingAddress() != null ?
				FlowMessage.convertFarcasterVerification(user.getDefaultReceivingAddress(), user) : null);
	}


	public static Flow convert(FlowMessage flowMessage, User user) {
		val flowSigner = getFlowSigner(flowMessage, user);
		val flowSignerProvider = getFlowSignerProvider(flowMessage);

		val flow = new Flow(user.getId(), flowMessage.title(),
				flowSigner, flowSignerProvider,
				flowMessage.signerType, flowMessage.signerCredential,
				flowMessage.walletProvider,
				flowMessage.saltNonce);
		val wallets = flowMessage.wallets().stream().map(w -> {
			val wallet = WalletMessage.convert(w);
			wallet.setFlow(flow);
			return wallet;
		}).toList();
		flow.setWallets(wallets);
		return flow;
	}
}
