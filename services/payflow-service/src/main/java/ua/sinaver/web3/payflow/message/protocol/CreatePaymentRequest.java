package ua.sinaver.web3.payflow.message.protocol;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;

public record CreatePaymentRequest(
		ua.sinaver.web3.payflow.entity.Payment.PaymentType type,
		String name,
		Source source,
		Recipient recipient,
		Payer payer,
		Payment payment,
		Instant expiresAt) {
	public record Source(
			String type,
			String url) {
	}

	public record Recipient(
			Social social,
			String address,
			String comment) {
		public record Social(
				String type,
				String identifier) {
		}
	}

	public record Payment(
			String amount,
			String token,
			Integer chainId,
			JsonNode calls) {
	}

	public record Payer(String sessionId) {

	}
}
