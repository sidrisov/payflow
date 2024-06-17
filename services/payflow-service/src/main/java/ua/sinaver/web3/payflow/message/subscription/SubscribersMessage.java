package ua.sinaver.web3.payflow.message.subscription;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;

import java.util.List;


@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record SubscribersMessage(
		List<Subscriber> subscribers
) {
	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Subscriber(
			String object,
			FarcasterUser user,
			List<SubscribedTo> subscribedTo
	) {
	}
	
	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record SubscribedTo(
			String object,
			String providerName,
			String contractAddress,
			int chain
	) {
	}
}

