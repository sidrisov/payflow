package ua.sinaver.web3.payflow.message.farcaster;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonIgnoreProperties(ignoreUnknown = true)
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
		List<AuthAddress> authAddresses,
		String activeStatus,
		ViewerContext viewerContext) {
	public List<String> addresses() {
		Stream<String> authAddressesStream = authAddresses != null
				? authAddresses.stream().map(AuthAddress::address)
				: Stream.empty();

		Stream<String> verificationsStream = verifications != null
				? verifications.stream()
				: Stream.empty();

		return Stream.concat(
				Stream.concat(verificationsStream, authAddressesStream),
				Stream.of(custodyAddress)).filter(Objects::nonNull).toList();
	}

	public List<String> addressesWithoutCustodialIfAvailable() {
		if (verifications.isEmpty()) {
			return Collections.singletonList(custodyAddress);
		} else {
			return verifications;
		}
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Profile(Bio bio) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Bio(
			String text,
			List<FarcasterUser> mentionedProfiles) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record VerifiedAddresses(
			List<String> ethAddresses,
			List<String> solAddresses) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	@JsonIgnoreProperties(ignoreUnknown = true)
	public record AuthAddress(String address) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record ViewerContext(boolean following, boolean followedBy) {
	}
}
