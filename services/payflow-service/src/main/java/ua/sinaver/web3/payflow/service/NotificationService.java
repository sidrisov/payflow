package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.entity.Payment;
import ua.sinaver.web3.payflow.entity.User;
import ua.sinaver.web3.payflow.events.CastEvent;
import ua.sinaver.web3.payflow.message.farcaster.Cast;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;
import ua.sinaver.web3.payflow.message.farcaster.neynar.NotificationRequest;
import ua.sinaver.web3.payflow.message.nft.ParsedMintUrlMessage;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.utils.FrameVersions;
import ua.sinaver.web3.payflow.utils.MintUrlUtils;

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class NotificationService {
	@Autowired
	private FarcasterNeynarService hubService;

	@Value("${payflow.farcaster.bot.cast.signer}")
	private String botSignerUuid;

	@Value("${payflow.farcaster.bot.reply.enabled:true}")
	private boolean isBotReplyEnabled;

	@Autowired
	private FarcasterMessagingService farcasterMessagingService;

	@Autowired
	private IIdentityService identityService;

	@Autowired
	private ReceiptService receiptService;

	@Autowired
	private PayflowConfig payflowConfig;

	@Autowired
	private LinkService linkService;

	public static String formatDouble(Double value) {
		val df = new DecimalFormat("#.#####");
		return df.format(value);
	}

	public String preferredTokensReply(String parentHash, FarcasterUser user,
			List<String> preferredTokenIds) {

		val formattedTokenIds = String.join(", ", preferredTokenIds).toUpperCase();
		val castText = String.format("""
				@%s, your preferred receiving tokens have been updated:
				%s ✅""",
				user.username(), formattedTokenIds);

		val embeds = Collections.singletonList(new Cast.Embed(
				UriComponentsBuilder.fromHttpUrl(
						payflowConfig.getDAppServiceUrl()).path(user.username()).build().toUriString()));
		var processed = this.reply(castText, parentHash, embeds);
		if (processed == null) {
			log.error("Failed to reply with {} for preferredTokens configuration", castText);
			return null;

		}
		return processed;
	}

	public String reply(String text, String parentHash) {
		return reply(text, parentHash, Collections.emptyList());
	}

	public String reply(String text, String parentHash, List<Cast.Embed> embeds) {
		if (isBotReplyEnabled) {
			var response = hubService.cast(botSignerUuid, text, parentHash, embeds);
			if (response != null && response.success() && response.cast() != null) {
				log.debug("Successfully processed bot cast with reply: {}",
						response.cast());
				return response.cast().hash();
			}

		} else {
			log.debug("Bot reply disabled, skipping casting the reply");
			return null;
		}
		return null;
	}

	public void notifyPaymentCompletion(Payment payment, User user) {
		if (!StringUtils.isBlank(payment.getHash()) || !StringUtils.isBlank(payment.getRefundHash())) {
			val receiverFname = getReceiverUsername(payment);
			if (StringUtils.isBlank(receiverFname)) {
				log.warn("Can't notify user, since farcaster name wasn't found: {}", payment);
				return;
			}
			val senderFname = identityService.getFarcasterUsernameByAddress(user != null ? user.getIdentity()
					: payment.getSender() != null ? payment.getSender().getIdentity() : payment.getSenderAddress());

			val receiptUrl = receiptService.getReceiptUrl(payment, false,
					payment.getRefundHash() != null);
			val sourceRefText = StringUtils.isNotBlank(payment.getSourceRef()) ? payment.getSourceRef()
					: StringUtils.isNotBlank(payment.getSourceHash()) ? String.format(
							"🔗 Source: https://warpcast.com/%s/%s",
							receiverFname, payment.getSourceHash().substring(0, 10)) : "";

			if (payment.getRefundHash() != null) {
				handleRefundNotification(payment, senderFname, receiptUrl, sourceRefText);
				return;
			}

			val crossChainText = payment.getFulfillmentId() != null ? " (cross-chain)" : "";

			val isSelfPurchase = StringUtils.equalsIgnoreCase(senderFname, receiverFname);

			if (StringUtils.isBlank(payment.getCategory())
					|| List.of("reward", "reward_top_reply", "reward_top_casters").contains(payment.getCategory())) {
				handleP2PPaymentNotification(payment, senderFname, receiverFname, receiptUrl,
						sourceRefText);
			} else if (payment.getCategory().equals("fc_storage")) {
				handleStoragePaymentNotification(payment, senderFname, receiverFname, receiptUrl, crossChainText,
						sourceRefText);
			} else if (payment.getCategory().equals("mint")) {
				handleMintPaymentNotification(payment, senderFname, receiverFname, receiptUrl, sourceRefText,
						isSelfPurchase);
			} else if (payment.getCategory().equals("hypersub")) {
				handleHypersubPaymentNotification(payment, senderFname, receiverFname,
						receiptUrl,
						sourceRefText, isSelfPurchase);
			}
		}
	}

	private void sendCastReply(String castText, String sourceHash, List<Cast.Embed> embeds) {
		val processed = reply(castText, sourceHash, embeds);
		if (processed == null) {
			log.error("Failed to reply with {} for payment completion", castText);
		}
	}

	private void sendDirectMessage(String messageText, Integer receiverFid) {
		try {
			val response = farcasterMessagingService.sendMessage(
					new DirectCastMessage(receiverFid, messageText, UUID.randomUUID()));

			if (StringUtils.isBlank(response.result().messageId())) {
				log.error("Failed to send direct cast with {} for payment completion", messageText);
			}
		} catch (Throwable t) {
			log.error("Failed to send direct cast with exception: ", t);
		}
	}

	private void handleP2PPaymentNotification(Payment payment, String senderFname, String receiverFname,
			String receiptUrl,
			String sourceRefText) {
		val embeds = new ArrayList<Cast.Embed>();
		if (payment.getTarget() != null) {
			embeds.add(new Cast.Embed(payment.getTarget()));
		}
		embeds.add(new Cast.Embed(receiptUrl));

		val commentText = StringUtils.isNotBlank(payment.getComment())
				? String.format("""
						with 💬 "%s"
						""", payment.getComment())
				: "";

		if (payment.getCategory() == null) {
			val castText = String.format("""
					@%s, you received %s %s%s 💸""",
					receiverFname,
					StringUtils.isNotBlank(payment.getTokenAmount())
							? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
							: String.format("$%s", payment.getUsdAmount()),
					payment.getToken().toUpperCase(),
					formatFromPart(senderFname));

			sendCastReply(castText, payment.getSourceHash(), embeds);

			val receiverFid = getReceiverFid(payment);
			if (receiverFid != null) {
				val messageText = String.format("""
						You received %s %s%s %s

						%s
						🧾 Receipt: %s""",
						StringUtils.isNotBlank(payment.getTokenAmount())
								? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
								: String.format("$%s", payment.getUsdAmount()),
						payment.getToken().toUpperCase(),
						formatFromPart(senderFname),
						commentText,
						sourceRefText,
						receiptUrl);

				sendDirectMessage(messageText, receiverFid);

				try {
					val frameV2ReceiptUrl = linkService.paymentLink(payment, false).toString();
					val notification = NotificationRequest.Notification.create(
							String.format("Received %s %s", StringUtils.isNotBlank(payment.getTokenAmount())
									? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
									: String.format("$%s", payment.getUsdAmount()),
									payment.getToken().toUpperCase()),
							String.format("%s %s",
									formatFromPart(senderFname),
									commentText).trim(),
							frameV2ReceiptUrl);

					hubService.notify(notification, Collections.singletonList(receiverFid));
				} catch (Throwable t) {
					log.error("Failed to notify user with frame v2 notification: ", t);
				}
			}
		} else {
			switch (payment.getCategory()) {
				case "reward":
					sendRewardNotification(payment, senderFname, receiverFname, commentText,
							sourceRefText,
							"your cast", embeds);
					break;
				case "reward_top_reply":
					log.error("Not supported payment category: {}", payment.getCategory());
					break;

				case "reward_top_casters":
					sendRewardNotification(payment, senderFname, receiverFname, commentText,
							sourceRefText,
							"being top caster", embeds);
					break;

			}
		}
	}

	private void handleStoragePaymentNotification(Payment payment, String senderFname, String receiverFname,
			String receiptUrl, String crossChainText,
			String sourceRefText) {
		val receiverFid = payment.getReceiverFid();

		val storageFrameUrl = UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
				.path("/~/farcaster/storage?fid={fid}&{version}")
				.buildAndExpand(receiverFid, FrameVersions.STORAGE_VERSION)
				.toUriString();

		val numberOfUnits = payment.getTokenAmount() != null ? payment.getTokenAmount() : 1;
		val castText = String.format("""
				@%s, you've been paid %s unit(s) of storage%s by @%s 🗄""",
				receiverFname,
				numberOfUnits,
				crossChainText,
				senderFname);

		val embeds = List.of(new Cast.Embed(storageFrameUrl), new Cast.Embed(receiptUrl));
		sendCastReply(castText, payment.getSourceHash(), embeds);

		if (receiverFid != null) {
			val commentText = StringUtils.isNotBlank(payment.getComment())
					? String.format("\n💬 Comment: %s", payment.getComment())
					: "";

			val messageText = String.format("""
					@%s, you've been paid %s units of storage%s by @%s 🗄

					%s
					%s
					🧾 Receipt: %s
					📊 Your storage usage now: %s""",
					receiverFname,
					numberOfUnits,
					crossChainText,
					senderFname,
					commentText,
					sourceRefText,
					receiptUrl,
					storageFrameUrl);

			sendDirectMessage(messageText, receiverFid);
		}
	}

	private void handleMintPaymentNotification(Payment payment, String senderFname, String receiverFname,
			String receiptUrl, String sourceRefText, boolean isSelfPurchase) {
		val mintUrlMessage = ParsedMintUrlMessage.fromCompositeToken(payment.getToken(),
				payment.getNetwork().toString(), payment.getTarget());

		val frameMintUrl = MintUrlUtils.calculateFrameMintUrlFromToken(
				payflowConfig.getDAppServiceUrl(),
				payment.getToken(),
				payment.getNetwork().toString(),
				payment.getSender().getIdentity());

		var authorPart = "";
		if (mintUrlMessage != null && mintUrlMessage.author() != null) {
			val author = identityService.getFarcasterUsernameByAddress(mintUrlMessage.author());
			if (author != null) {
				authorPart = String.format("@%s's ", author);
			}
		}

		val tokenAmount = payment.getTokenAmount() != null ? Double.parseDouble(payment.getTokenAmount()) : 1;
		val tokenAmountText = tokenAmount > 1 ? tokenAmount + "x " : "";

		String castText;
		if (isSelfPurchase) {
			castText = String.format("""
					@%s, you've successfully minted %s%scollectible from the cast above ✨""",
					senderFname,
					tokenAmountText,
					authorPart);
		} else {
			castText = String.format("""
					@%s, you've been gifted %s%scollectible by @%s from the cast above  ✨""",
					receiverFname,
					tokenAmountText,
					authorPart,
					senderFname);
		}

		val embeds = List.of(new Cast.Embed(frameMintUrl), new Cast.Embed(receiptUrl));
		sendCastReply(castText, payment.getSourceHash(), embeds);

		val commentText = StringUtils.isNotBlank(payment.getComment())
				? String.format("\n💬 Comment: %s", payment.getComment())
				: "";

		String messageText;
		if (isSelfPurchase) {
			messageText = String.format("""
					@%s, you've successfully minted %s%scollectible from the cast above ✨

					%s
					%s
					🧾 Receipt: %s""",
					senderFname,
					tokenAmountText,
					authorPart,
					commentText,
					sourceRefText,
					receiptUrl);
		} else {
			messageText = String.format("""
					@%s, you've been gifted %s%scollectible by @%s from the cast above ✨

					%s
					%s
					🧾 Receipt: %s""",
					receiverFname,
					tokenAmountText,
					authorPart,
					senderFname,
					commentText,
					sourceRefText,
					receiptUrl);
		}

		sendDirectMessage(messageText, getReceiverFid(payment));
	}

	private void handleHypersubPaymentNotification(Payment payment, String senderFname,
			String receiverFname,
			String receiptUrl, String sourceRefText, boolean isSelfPurchase) {
		val tokenAmount = payment.getTokenAmount() != null ? Double.parseDouble(payment.getTokenAmount()) : 1;
		val tokenAmountText = tokenAmount + " month(s) ";

		val authorPart = "";

		String castText;
		if (isSelfPurchase) {
			castText = String.format("""
					@%s, you've successfully subscribed to %s of %shypersub from the cast above 🕐""",
					senderFname,
					tokenAmountText,
					authorPart);
		} else {
			castText = String.format("""
					@%s, you've been gifted %s of %shypersub subscription by @%s from the cast above 🕐""",
					receiverFname,
					tokenAmountText,
					authorPart,
					senderFname);
		}

		sendCastReply(castText, payment.getSourceHash(),
				Collections.singletonList(new Cast.Embed(receiptUrl)));

		val commentText = StringUtils.isNotBlank(payment.getComment())
				? String.format("\n💬 Comment: %s", payment.getComment())
				: "";

		String messageText;
		if (isSelfPurchase) {
			messageText = String.format("""
					@%s, you've successfully subscribed to %s of %shypersub from the cast above 🕐

					%s
					%s
					🧾 Receipt: %s""",
					senderFname,
					tokenAmountText,
					authorPart,
					commentText,
					sourceRefText,
					receiptUrl);
		} else {
			messageText = String.format("""
					@%s, you've been gifted %s of %shypersub subscription by @%s from the cast above 🕐

					%s
					%s
					🧾 Receipt: %s""",
					receiverFname,
					tokenAmountText,
					authorPart,
					senderFname,
					commentText,
					sourceRefText,
					receiptUrl);
		}

		sendDirectMessage(messageText, getReceiverFid(payment));
	}

	private void handleRefundNotification(Payment payment, String senderFname,
			String refundReceipt, String sourceRefText) {
		val category = StringUtils.isBlank(payment.getCategory()) ? "P2P" : payment.getCategory();
		val castText = String.format("""
				@%s, you've been refunded for "%s" payment initiated from the cast above 🔄""",
				senderFname,
				category);

		sendCastReply(castText, payment.getSourceHash(), Collections.singletonList(new Cast.Embed(refundReceipt)));
		if (payment.getSender() != null) {
			val senderFid = identityService.getIdentityFid(payment.getSender().getIdentity());
			if (senderFid != null) {
				val messageText = String.format("""
						@%s, you've been refunded for "%s" payment initiated from the cast above 🔄💸

						%s
						🧾 Receipt: %s""",
						senderFname,
						category,
						sourceRefText,
						refundReceipt);

				sendDirectMessage(messageText, senderFid);
			}
		}
	}

	private void sendRewardDirectMessage(Payment payment, String receiverFname, String senderFname,
			String commentText, String sourceRefText, String rewardReason) {
		val receiverFid = getReceiverFid(payment);
		if (receiverFid != null) {
			val messageText = String.format("""
					You received %s %s reward%s for %s 🎁

					%s
					🧾 Receipt: %s""",
					StringUtils.isNotBlank(payment.getTokenAmount())
							? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
							: String.format("$%s", payment.getUsdAmount()),
					payment.getToken().toUpperCase(),
					formatFromPart(senderFname),
					rewardReason,
					sourceRefText,
					receiptService.getReceiptUrl(payment));

			sendDirectMessage(messageText, receiverFid);
		}
	}

	private void sendRewardNotification(Payment payment, String senderFname, String receiverFname,
			String commentText, String sourceRefText, String rewardReason,
			List<Cast.Embed> embeds) {
		val castText = String.format("""
				@%s, you received %s %s reward%s for %s 🎁""",
				receiverFname,
				StringUtils.isNotBlank(payment.getTokenAmount())
						? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
						: String.format("$%s", payment.getUsdAmount()),
				payment.getToken().toUpperCase(),
				formatFromPart(senderFname),
				rewardReason);

		sendCastReply(castText, payment.getSourceHash(), embeds);
		sendRewardDirectMessage(payment, receiverFname, senderFname, commentText, sourceRefText,
				rewardReason);
	}

	private String formatFromPart(String senderFname) {
		return StringUtils.isNotBlank(senderFname) ? String.format(" from @%s", senderFname) : "";
	}

	private String getReceiverUsername(Payment payment) {
		if (payment.getReceiver() != null) {
			return identityService.getFarcasterUsernameByAddress(payment.getReceiver().getIdentity());
		} else if (payment.getReceiverAddress() != null) {
			return identityService.getFarcasterUsernameByAddress(payment.getReceiverAddress());
		} else if (payment.getReceiverFid() != null) {
			return identityService.getFidFname(payment.getReceiverFid());
		}
		return null;
	}

	private Integer getReceiverFid(Payment payment) {
		if (payment.getReceiverFid() != null) {
			return payment.getReceiverFid();
		} else if (payment.getReceiver() != null) {
			return identityService.getIdentityFid(payment.getReceiver().getIdentity());
		} else if (payment.getReceiverAddress() != null) {
			return identityService.getIdentityFid(payment.getReceiverAddress());
		}
		return null;
	}

	@Async
	@TransactionalEventListener
	public void handleCastEvent(CastEvent event) {
		reply(event.message(), event.castHash(), event.embeds());
	}
}
