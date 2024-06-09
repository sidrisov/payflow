package ua.sinaver.web3.payflow.message.subscription;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.util.List;


@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record SubscribersMessage(
		List<Subscriber> subscribers
) {
	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Subscriber(
			String object,
			Creator creator,
			List<SubscribedTo> subscribedTo
	) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Creator(
			String object,
			int fid,
			String custodyAddress,
			String username,
			String displayName,
			String pfpUrl,
			Profile profile,
			int followerCount,
			int followingCount,
			List<String> verifications,
			VerifiedAddresses verifiedAddresses,
			String activeStatus,
			boolean powerBadge,
			ViewerContext viewerContext
	) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Profile(
			Bio bio
	) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Bio(
			String text
	) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record VerifiedAddresses(
			List<String> ethAddresses,
			List<String> solAddresses
	) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record ViewerContext(
			boolean following,
			boolean followedBy
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

