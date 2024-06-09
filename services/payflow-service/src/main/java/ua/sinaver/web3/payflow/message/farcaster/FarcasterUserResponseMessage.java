package ua.sinaver.web3.payflow.message.farcaster;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.util.List;

public record FarcasterUserResponseMessage(FarcasterUser user) {
	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record FarcasterUser(
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
			boolean powerBadge
	) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Profile(
			Bio bio
	) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Bio(
			String text,
			List<String> mentionedProfiles
	) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record VerifiedAddresses(
			List<String> ethAddresses,
			List<String> solAddresses
	) {
	}
}




