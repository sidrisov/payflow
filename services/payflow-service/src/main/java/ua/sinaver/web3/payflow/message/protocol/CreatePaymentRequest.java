package ua.sinaver.web3.payflow.message.protocol;

import java.time.Instant;

public record CreatePaymentRequest(
		String type,
		String name,
		Source source,
		Recipient recipient,
		Payment payment,
		Instant expiresAt
) {
	public record Source(
			String type,
			String url
	) {
	}

	public record Recipient(
			Social social,
			String address,
			String comment
	) {
		public record Social(
				String type,
				String identifier
		) {
		}
	}

	public record Payment(
			String amount,
			String token,
			Integer chain
	) {
	}
}
