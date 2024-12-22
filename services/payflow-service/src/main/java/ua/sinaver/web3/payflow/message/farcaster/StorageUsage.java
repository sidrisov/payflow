package ua.sinaver.web3.payflow.message.farcaster;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record StorageUsage(
		User user,
		int totalActiveUnits,
		int soonExpireUnits,
		Storage casts,
		Storage reactions,
		Storage links,
		Capacity verifications,
		Capacity usernameProofs,
		Capacity signers
) {

	public StorageUsage withSoonExpireUnits(
			StorageAllocationsResponse storageAllocations
	) {
		int soonExpireUnits = storageAllocations.calculateUnitsExpiringInOneMonth();
		return new StorageUsage(
				user,
				totalActiveUnits,
				soonExpireUnits,
				casts,
				reactions,
				links,
				verifications,
				usernameProofs,
				signers
		);
	}

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


