package ua.sinaver.web3.payflow.message.farcaster;

import lombok.val;

import java.time.LocalDate;
import java.util.List;

public record StorageAllocationsResponse(
		int totalActiveUnits,
		List<StorageAllocation> allocations
) {

	// Method to calculate the total units expiring in one month
	public int calculateUnitsExpiringInOneMonth() {
		val now = LocalDate.now();
		val oneMonthFromNow = now.plusMonths(1);

		return allocations.stream()
				.filter(allocation -> isExpiringInOneMonth(allocation.expiry(), now, oneMonthFromNow))
				.mapToInt(StorageAllocation::units)
				.sum();
	}

	private boolean isExpiringInOneMonth(LocalDate expiryDate, LocalDate now, LocalDate oneMonthFromNow) {
		return (expiryDate.isAfter(now.minusDays(1)) || expiryDate.isEqual(now)) &&
				(expiryDate.isBefore(oneMonthFromNow.plusDays(1)) || expiryDate.isEqual(oneMonthFromNow));
	}

	public record StorageAllocation(
			String object,
			User user,
			int units,
			LocalDate expiry,
			LocalDate timestamp
	) {
	}

	public record User(String object, int fid) {
	}
}




