package ua.sinaver.web3.payflow.message;

import org.apache.commons.lang3.StringUtils;
import ua.sinaver.web3.payflow.data.Payment;

public record PaymentMessage(String referenceId,
                             Payment.PaymentType type,
                             String category,
                             Payment.PaymentStatus status,
                             ProfileMetaMessage receiver,
                             FlowMessage receiverFlow,
                             String receiverAddress,
                             Integer receiverFid,
                             ProfileMetaMessage sender,
                             int chainId,
                             String token,
                             Double usdAmount,
                             Double tokenAmount,
                             String hash,
                             PaymentSource source,
                             String comment) {

	public static PaymentMessage convert(Payment payment, boolean includeRef,
	                                     boolean includeComment) {
		return new PaymentMessage(
				includeRef ? payment.getReferenceId() : null,
				payment.getType(),
				payment.getCategory(),
				payment.getStatus(),
				payment.getReceiver() != null ?
						ProfileMetaMessage.convert(payment.getReceiver(),
								true) : null,
				payment.getReceiverFlow() != null ?
						FlowMessage.convert(payment.getReceiverFlow(), null, false)
						: null,
				payment.getReceiverAddress(),
				payment.getReceiverFid(),
				payment.getSender() != null ?
						ProfileMetaMessage.convert(payment.getSender(), false) : null,
				payment.getNetwork(),
				payment.getToken(),
				StringUtils.isNotBlank(payment.getUsdAmount()) ?
						Double.parseDouble(payment.getUsdAmount()) : null,
				StringUtils.isNotBlank(payment.getTokenAmount()) ?
						Double.parseDouble(payment.getTokenAmount()) : null,
				payment.getHash(),
				new PaymentMessage.PaymentSource(payment.getSourceApp(), payment.getSourceRef()),
				includeComment ? payment.getComment() : null);
	}

	public record PaymentSource(String app, String ref) {
	}
}