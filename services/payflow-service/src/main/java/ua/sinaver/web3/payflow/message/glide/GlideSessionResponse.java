package ua.sinaver.web3.payflow.message.glide;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class GlideSessionResponse {
	private String sessionId;
	private PaymentStatus paymentStatus;
	private String paymentChainId;
	private String paymentTransactionHash;
	private String sponsoredTransactionHash;
	private TransactionStatus sponsoredTransactionStatus;
	private String refundTransactionHash;
	private boolean expired;

	public enum PaymentStatus {
		@JsonProperty("unpaid")
		UNPAID,
		@JsonProperty("paid")
		PAID,
		@JsonProperty("pending_refund")
		PENDING_REFUND,
		@JsonProperty("refunded")
		REFUNDED
	}

	public enum TransactionStatus {
		@JsonProperty("created")
		CREATED,
		@JsonProperty("submitted")
		SUBMITTED,
		@JsonProperty("signed")
		SIGNED,
		@JsonProperty("pending")
		PENDING,
		@JsonProperty("success")
		SUCCESS,
		@JsonProperty("failed")
		FAILED,
		@JsonProperty("dropped")
		DROPPED
	}
}
