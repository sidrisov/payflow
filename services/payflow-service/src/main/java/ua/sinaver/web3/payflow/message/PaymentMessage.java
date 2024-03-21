package ua.sinaver.web3.payflow.message;

import org.apache.commons.lang3.StringUtils;
import ua.sinaver.web3.payflow.data.Payment;

public record PaymentMessage(String referenceId,
                             Payment.PaymentType type,
                             Payment.PaymentStatus status,
                             ProfileMetaMessage receiver,
                             FlowMessage receiverFlow,
                             int chainId,
                             String token,
                             Double usdAmount,
                             String hash,
                             PaymentSource source,
                             String comment) {

	public static PaymentMessage convert(Payment payment, boolean includeRef) {
		return new PaymentMessage(
				includeRef ? payment.getReferenceId() : null,
				payment.getType(),
				payment.getStatus(),
				ProfileMetaMessage.convert(payment.getReceiver(), true),
				payment.getReceiverFlow() != null ?
						FlowMessage.convert(payment.getReceiverFlow(), null)
						: null,
				payment.getNetwork(),
				payment.getToken(),
				StringUtils.isNotBlank(payment.getUsdAmount()) ?
						Double.parseDouble(payment.getUsdAmount()) : null,
				payment.getHash(),
				new PaymentMessage.PaymentSource(payment.getSourceApp(),
						payment.getSourceRef()), payment.getComment());
	}

	public record PaymentSource(String app, String ref) {
	}
}