package ua.sinaver.web3.payflow.message;

import ua.sinaver.web3.payflow.data.Payment;

public record PaymentMessage(String referenceId,
                             Payment.PaymentType type,
                             Payment.PaymentStatus status,
                             ProfileMetaMessage receiver,
                             int chainId,
                             String token,
                             String usdAmount,
                             String hash,
                             PaymentSource source,
                             String comment) {

	public static PaymentMessage convert(Payment payment, boolean includeRef) {
		return new PaymentMessage(
				includeRef ? payment.getReferenceId() : null,
				payment.getType(),
				payment.getStatus(),
				ProfileMetaMessage.convert(payment.getReceiver(), true),
				payment.getNetwork(),
				payment.getToken(),
				payment.getUsdAmount(),
				payment.getHash(),
				new PaymentMessage.PaymentSource(payment.getSourceApp(),
						payment.getSourceRef()), payment.getComment());
	}

	public record PaymentSource(String app, String ref) {
	}
}