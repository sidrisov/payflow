package ua.sinaver.web3.payflow.message.subscription;

import java.math.BigInteger;

public record SubscriberMessage(
		int tierId,
		BigInteger tokenId,
		long expiresAt,
		long purchaseExpiresAt,
		BigInteger rewardShares,
		BigInteger rewardBalance,
		String account
) {
}
