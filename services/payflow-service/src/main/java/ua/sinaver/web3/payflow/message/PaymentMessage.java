package ua.sinaver.web3.payflow.message;

import org.apache.commons.lang3.StringUtils;
import ua.sinaver.web3.payflow.data.Payment;

import java.time.Instant;

public record PaymentMessage(
		String referenceId,
		Payment.PaymentType type,
		String category,
		Payment.PaymentStatus status,
		ProfileMetaMessage receiver,
		FlowMessage receiverFlow,
		String senderAddress,
		String receiverAddress,
		Integer receiverFid,
		ProfileMetaMessage sender,
		int chainId,
		String token,
		Double usdAmount,
		Double tokenAmount,
		String hash,
		String fulfillmentId,
		Integer fulfillmentChainId,
		String fulfillmentHash,
		String refundHash,
		PaymentSource source,
		String comment,
		String target,
		Instant createdAt,
		Instant completedAt,
		Instant expiresAt) {

	public static PaymentMessage convert(Payment payment, boolean includeRef,
	                                     boolean includeComment) {
		return new PaymentMessage(
				includeRef ? payment.getReferenceId() : null,
				payment.getType(),
				payment.getCategory(),
				getStatusWithExpiryCheck(payment),
				payment.getReceiver() != null ? ProfileMetaMessage.convert(payment.getReceiver(),
						true) : null,
				payment.getReceiverFlow() != null ? FlowMessage.convert(payment.getReceiverFlow(), null, false)
						: null,
				payment.getSenderAddress(),
				payment.getReceiverAddress(),
				payment.getReceiverFid(),
				payment.getSender() != null ? ProfileMetaMessage.convert(payment.getSender(), false) : null,
				payment.getNetwork(),
				payment.getToken(),
				StringUtils.isNotBlank(payment.getUsdAmount()) ? Double.parseDouble(payment.getUsdAmount()) : null,
				StringUtils.isNotBlank(payment.getTokenAmount()) ? Double.parseDouble(payment.getTokenAmount()) : null,
				payment.getHash(),
				payment.getFulfillmentId(),
				payment.getFulfillmentChainId(),
				payment.getFulfillmentHash(),
				payment.getRefundHash(),
				new PaymentMessage.PaymentSource(payment.getSourceApp(), payment.getSourceRef()),
				includeComment ? payment.getComment() : null,
				payment.getTarget(),
				payment.getCreatedAt(),
				payment.getCompletedAt(),
				payment.getExpiresAt());
	}

	public static Payment.PaymentStatus getStatusWithExpiryCheck(Payment payment) {
		return Payment.PaymentStatus.CREATED.equals(payment.getStatus()) && payment.getExpiresAt() != null && payment.getExpiresAt().isBefore(Instant.now()) ?
				Payment.PaymentStatus.EXPIRED : payment.getStatus();
	}

	public record PaymentSource(String app, String ref) {
	}
}
