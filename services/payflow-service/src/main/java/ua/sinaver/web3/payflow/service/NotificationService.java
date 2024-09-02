package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.message.farcaster.Cast;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;

import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class NotificationService {

	@Autowired
	private IdentityService identityService;

	@Autowired
	private ReceiptService receiptService;

	@Autowired
	private PayflowConfig payflowConfig;

	@Autowired
	private FarcasterNeynarService hubService;

	@Value("${payflow.farcaster.bot.cast.signer}")
	private String botSignerUuid;

	@Value("${payflow.farcaster.bot.reply.enabled:true}")
	private boolean isBotReplyEnabled;

	public void paymentReply(Payment payment, FarcasterUser sender, FarcasterUser receiver) {
		val senderIdentity = payment.getSender() != null ? payment.getSender().getIdentity()
				: payment.getSenderAddress();
		val receiverIdentity = payment.getReceiver() != null ? payment.getReceiver().getIdentity()
				: payment.getReceiverAddress() != null ? payment.getReceiverAddress()
				: "fc_fid:" + payment.getReceiverFid();

		if (StringUtils.isBlank(senderIdentity) || StringUtils.isBlank((receiverIdentity))) {
			log.error("Sender or receiver can't be unknown for payment: {}", payment);
			return;
		}

		val senderFname = sender != null ? sender.username() :
				identityService.getIdentityFname(senderIdentity);
		val receiverFname = receiver != null ? receiver.username() :
				identityService.getIdentityFname(receiverIdentity);
		val receiptUrl = receiptService.getReceiptUrl(payment);
		val embeds = Collections.singletonList(new Cast.Embed(receiptUrl));

		val castText = String.format("""
						@%s, you've been paid %s %s by @%s 🎉

						p.s. join /payflow channel for updates 👀""",
				receiverFname,
				StringUtils.isNotBlank(payment.getTokenAmount()) ? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
						: String.format("$%s", payment.getUsdAmount()),
				payment.getToken().toUpperCase(),
				senderFname);

		var processed = this.reply(castText,
				payment.getSourceHash(),
				embeds);

		if (!processed) {
			log.error("Failed to reply with {} for payment intent completion", castText);
		}
	}

	public boolean preferredTokensReply(String parentHash, FarcasterUser user,
	                                    List<String> preferredTokenIds) {

		val formattedTokenIds = String.join(", ", preferredTokenIds).toUpperCase();
		val castText = String.format("""
						@%s, your preferred receiving tokens have been updated:
						%s ✅

						p.s. join /payflow channel for updates 👀""",
				user.username(), formattedTokenIds);

		val embeds = Collections.singletonList(new Cast.Embed(
				UriComponentsBuilder.fromHttpUrl(
						payflowConfig.getFramesServiceUrl()).path(user.username()).build().toUriString()
		));
		var processed = this.reply(castText, parentHash, embeds);
		if (!processed) {
			log.error("Failed to reply with {} for preferredTokens configuration", castText);
			return false;

		}
		return true;
	}

	public boolean reply(String text, String parentHash, List<Cast.Embed> embeds) {
		if (isBotReplyEnabled) {
			var response = hubService.cast(botSignerUuid, text, parentHash, embeds);
			if (response != null && response.success()) {
				log.debug("Successfully processed bot cast with reply: {}",
						response.cast());
				return true;
			} else {
				response = hubService.cast(botSignerUuid, text, null, embeds);
				if (response != null && response.success()) {
					log.debug("Successfully processed bot cast without reply: {}",
							response.cast());
					return true;
				}
			}
		} else {
			log.debug("Bot reply disabled, skipping casting the reply");
			return true;
		}

		return false;
	}
}
