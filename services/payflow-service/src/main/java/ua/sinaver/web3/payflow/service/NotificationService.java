package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.message.farcaster.Cast;

import java.util.Collections;

@Service
@Slf4j
public class NotificationService {

	@Autowired
	private FarcasterPaymentBotService paymentBotService;

	@Autowired
	private IdentityService identityService;


	public void paymentReply(Payment payment) {
		val senderIdentity = payment.getSender() != null ? payment.getSender().getIdentity()
				: payment.getSenderAddress();
		val receiverIdentity = payment.getReceiver() != null ? payment.getReceiver().getIdentity()
				: payment.getReceiverAddress() != null ? payment.getReceiverAddress()
				: "fc_fid:" + payment.getReceiverFid();

		if (StringUtils.isBlank(senderIdentity) || StringUtils.isBlank((receiverIdentity))) {
			log.error("Sender or receiver can't be unknown for payment: {}", payment);
			return;
		}

		val senderFname = identityService.getIdentityFname(senderIdentity);
		val receiverFname = identityService.getIdentityFname(receiverIdentity);
		val receiptUrl = String.format(
				"https://onceupon.gg/%s", payment.getHash());
		val embeds = Collections.singletonList(new Cast.Embed(receiptUrl));

		val castText = String.format("""
						@%s, you've been paid %s %s by @%s 🎉

						🧾 Receipt: %s

						p.s. join /payflow channel for updates 👀""",
				receiverFname,
				StringUtils.isNotBlank(payment.getTokenAmount()) ? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
						: String.format("$%s", payment.getUsdAmount()),
				payment.getToken().toUpperCase(),
				senderFname,
				receiptUrl);

		var processed = paymentBotService.reply(castText,
				payment.getSourceHash(),
				embeds);

		if (!processed) {
			log.error("Failed to reply with {} for payment intent completion", castText);
		}
	}
}
