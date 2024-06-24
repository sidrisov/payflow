package ua.sinaver.web3.payflow.message.farcaster;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record StorageUsage(
		int totalActiveUnits,
		Storage casts,
		Storage reactions,
		Storage links,
		Capacity verifications,
		Capacity usernameProofs,
		Capacity signers
) {
	public record User(
			String object,
			int fid
	) {
	}

	public record Storage(
			String object,
			int used,
			int capacity
	) {
	}

	public record Capacity(
			int used,
			int capacity
	) {
	}
}


