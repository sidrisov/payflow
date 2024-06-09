package ua.sinaver.web3.payflow.message.subscription;


import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.util.List;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record SubscriptionsCreatedMessage(
		List<Subscription> subscriptionsCreated
) {
	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Subscription(
			String object,
			String providerName,
			String contractAddress,
			int chain,
			Metadata metadata,
			String ownerAddress,
			Price price,
			int protocolVersion,
			Token token
	) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Metadata(
			String title,
			String symbol,
			String artUrl
	) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Price(
			long periodDurationSeconds,
			String tokensPerPeriod
	) {
	}

	public record Token(
			String symbol,
			String address,
			int decimals,
			boolean erc20
	) {
	}
}



