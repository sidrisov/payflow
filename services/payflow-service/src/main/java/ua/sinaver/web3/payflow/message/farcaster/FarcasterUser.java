package ua.sinaver.web3.payflow.message.farcaster;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.util.Collections;
import java.util.List;
import java.util.stream.Stream;

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
		boolean powerBadge,
		ViewerContext viewerContext
) {
	public List<String> addresses() {
		return Stream.concat(verifications.stream(), Stream.of(custodyAddress))
				.toList();
	}

	public List<String> addressesWithoutCustodialIfAvailable() {
		if (verifications.isEmpty()) {
			return Collections.singletonList(custodyAddress);
		} else {
			return verifications;
		}
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Profile(Bio bio
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

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record ViewerContext(boolean following, boolean followedBy
	) {
	}
}
