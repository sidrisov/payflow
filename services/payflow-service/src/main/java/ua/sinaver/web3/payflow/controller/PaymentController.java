package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.message.PaymentHashMessage;
import ua.sinaver.web3.payflow.message.PaymentMessage;
import ua.sinaver.web3.payflow.message.farcaster.Cast;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.FarcasterMessagingService;
import ua.sinaver.web3.payflow.service.FarcasterPaymentBotService;
import ua.sinaver.web3.payflow.service.PaymentService;
import ua.sinaver.web3.payflow.service.SocialGraphService;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.service.api.IUserService;

import java.security.Principal;
import java.text.DecimalFormat;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/payment")
@CrossOrigin(origins = "${payflow.dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
public class PaymentController {
	@Autowired
	private IUserService userService;

	@Autowired
	private PaymentRepository paymentRepository;

	@Autowired
	private FarcasterPaymentBotService farcasterPaymentBotService;

	@Autowired
	private FarcasterMessagingService farcasterMessagingService;

	@Autowired
	private IIdentityService identityService;

	@Autowired
	private SocialGraphService socialGraphService;

	@Autowired
	private IFarcasterNeynarService neynarService;

	public static String formatDouble(Double value) {
		val df = new DecimalFormat("#.#####");
		return df.format(value);
	}

	@GetMapping
	public List<PaymentMessage> payments(@RequestParam(value = "hashes") List<String> hashes,
	                                     Principal principal) {

		val username = principal != null ? principal.getName() : null;
		log.debug("{} fetching payments info for {}", username, hashes);

		if (hashes.isEmpty()) {
			return Collections.emptyList();
		}

		val user = username != null ? userService.findByIdentity(username) : null;
		val payments = paymentRepository.findByHashIn(hashes, user);

		log.debug("Fetched payments: {}", payments);

		return payments.stream()
				.map(payment -> PaymentMessage.convert(payment, false, true))
				.toList();
	}

	@GetMapping("/pending")
	public List<PaymentMessage> pendingPayments(Principal principal) {
		val username = principal != null ? principal.getName() : null;
		log.debug("Fetching pending payments for {} ", username);

		val user = userService.findByIdentity(username);
		if (user == null) {
			return Collections.emptyList();
		}
		val verifications = identityService.getIdentityAddresses(user.getIdentity()).stream()
				.map(String::toLowerCase).toList();

		return paymentRepository.findBySenderOrSenderAddressInAndStatusInAndTypeInOrderByCreatedDateDesc(
						user, verifications, List.of(Payment.PaymentStatus.PENDING,
								Payment.PaymentStatus.COMPLETED),
						List.of(Payment.PaymentType.INTENT, Payment.PaymentType.INTENT_TOP_REPLY,
								Payment.PaymentType.FRAME))
				.stream()
				.map(payment -> PaymentMessage.convert(payment, true, true))
				.toList();
	}

	@GetMapping("/{referenceId}")
	@ResponseStatus(HttpStatus.OK)
	public ResponseEntity<PaymentMessage> payment(@PathVariable String referenceId, Principal principal) {
		val username = principal != null ? principal.getName() : null;
		log.debug("Fetching payment by refId {} by user {}", referenceId, username);
		val user = userService.findByIdentity(username);

		val payment = paymentRepository.findByReferenceId(referenceId);
		if (payment == null) {
			log.error("Payment doesn't exist: {}", referenceId);
			return ResponseEntity.notFound().build();
		}

		if (!(payment.getType().equals(Payment.PaymentType.FRAME)
				|| payment.getType().equals(Payment.PaymentType.INTENT)
				|| payment.getType().equals(Payment.PaymentType.INTENT_TOP_REPLY))
				&& (user == null || !payment.getSender().getIdentity().equals(user.getIdentity()))) {
			log.error("{} is not allowed to fetch payment: {}", principal, payment);
			return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
		}

		return ResponseEntity.ok(PaymentMessage.convert(payment, true, false));
	}

	@PutMapping("/{referenceId}")
	@ResponseStatus(HttpStatus.OK)
	public void completePayment(@PathVariable String referenceId,
	                            @RequestBody PaymentHashMessage hashMessage, Principal principal) {
		log.debug("Marking pending payment {} as complete with hash {} by user {}", referenceId,
				hashMessage,
				principal.getName());

		val user = userService.findByIdentity(principal.getName());

		if (user == null) {
			return;
		}

		val payment = paymentRepository.findByReferenceIdAndSender(referenceId, user);
		if (payment != null) {
			payment.setStatus(Payment.PaymentStatus.COMPLETED);
			payment.setHash(hashMessage.hash());
			payment.setCompletedDate(new Date());
			log.debug("Payment was marked as complete: {}", payment);

			// notify only for empty category as p2p payment
			// handle with different messages for other kind of payments
			if (!StringUtils.isBlank(payment.getSourceHash()) && !StringUtils.isBlank(payment.getHash())) {
				val senderFname = identityService.getIdentityFname(user.getIdentity());
				val receiverFname = identityService
						.getIdentityFname(payment.getReceiver() != null ? payment.getReceiver().getIdentity()
								: payment.getReceiverAddress() != null ? payment.getReceiverAddress()
								: "fc_fid:" + payment.getReceiverFid());
				val receiptUrl = String.format(
						"https://onceupon.gg/%s", payment.getHash());
				val embeds = Collections.singletonList(new Cast.Embed(receiptUrl));
				val sourceRef = String.format("https://warpcast.com/%s/%s",
						receiverFname, payment.getSourceHash().substring(0, 10));

				if (StringUtils.isBlank(payment.getCategory())) {
					if (payment.getType().equals(Payment.PaymentType.INTENT_TOP_REPLY)) {
						var scvText = "";

						val cast = socialGraphService.getReplySocialCapitalValue(payment.getSourceHash());
						if (cast != null) {
							scvText = String.format("with SCV score: %s ",
									formatDouble(cast.getSocialCapitalValue().getFormattedValue()));
						}

						val castText = String.format("""
										@%s, you've been paid %s %s by @%s for your top comment %s🎉

										🧾 Receipt: %s

										Install `🔥 Top Comment Intent` at app.payflow.me/actions
										p.s. join /payflow channel for updates 👀""",
								receiverFname,
								StringUtils.isNotBlank(payment.getTokenAmount()) ?
										PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
										: String.format("$%s", payment.getUsdAmount()),
								payment.getToken().toUpperCase(),
								senderFname,
								scvText,
								receiptUrl);

						val processed = farcasterPaymentBotService.reply(castText,
								payment.getSourceHash(),
								embeds);

						if (!processed) {
							log.error("Failed to reply with {} for payment intent completion", castText);
						}
					} else {
						// send both reply + intent for recipient who's on payflow
						val castText = String.format("""
										@%s, you've been paid %s %s by @%s 🎉

										🧾 Receipt: %s

										Install `💜️Intent` at app.payflow.me/actions
										p.s. join /payflow channel for updates 👀""",
								receiverFname,
								StringUtils.isNotBlank(payment.getTokenAmount()) ? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
										: String.format("$%s", payment.getUsdAmount()),
								payment.getToken().toUpperCase(),
								senderFname,
								receiptUrl);

						val processed = farcasterPaymentBotService.reply(castText,
								payment.getSourceHash(),
								embeds);

						if (!processed) {
							log.error("Failed to reply with {} for payment intent completion", castText);
						}

						if (payment.getReceiver() != null) {
							val receiverFid = identityService.getIdentityFid(payment.getReceiver().getIdentity());
							if (StringUtils.isBlank(receiverFid)) {
								return;
							}

							try {
								val messageText = String.format("""
												 @%s, you've been paid %s %s by @%s 🎉

												%s
												🧾 Receipt: %s

												Install `💜️Intent` at app.payflow.me/actions
												p.s. join /payflow channel for updates 👀""",
										receiverFname,
										StringUtils.isNotBlank(payment.getTokenAmount()) ? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
												: String.format("$%s", payment.getUsdAmount()),
										payment.getToken().toUpperCase(),
										senderFname,
										payment.getSourceRef() != null ? String.format("🔗 Source: %s",
												payment.getSourceRef()) : "",
										receiptUrl);
								val response = farcasterMessagingService.message(
										new DirectCastMessage(receiverFid, messageText, UUID.randomUUID()));

								if (!response.result().success()) {
									log.error("Failed to send direct cast with {} for payment intent " +
											"completion", messageText);
								}
							} catch (Throwable t) {
								log.error("Failed to send direct cast with exception: ", t);
							}
						}
					}
				} else if (payment.getCategory().equals("fc_storage")) {
					val storageUsage = neynarService.fetchStorageUsage(payment.getReceiverFid());
					val storageUsageText = storageUsage == null ? "" : String.format("""
											Total Active Units: %s
											📝 Casts: %s/%s
											👍 Reactions: %s/%s
											👥 Follows: %s/%s
									""",
							storageUsage.totalActiveUnits(),
							PaymentService.formatNumberWithSuffix(storageUsage.casts().used()),
							PaymentService.formatNumberWithSuffix(storageUsage.casts().capacity()),
							PaymentService.formatNumberWithSuffix(storageUsage.reactions().used()),
							PaymentService.formatNumberWithSuffix(storageUsage.reactions().capacity()),
							PaymentService.formatNumberWithSuffix(storageUsage.links().used()),
							PaymentService.formatNumberWithSuffix(storageUsage.links().capacity())
					);

					val castText = String.format("""
									@%s, you've been gifted %s units of storage by @%s 🎉
																			
									%s

									🧾 Receipt: %s

									Install `🗄 Gift Storage` at app.payflow.me/actions
									p.s. join /payflow channel for updates 👀""",
							receiverFname,
							payment.getTokenAmount(),
							senderFname,
							storageUsageText,
							receiptUrl);

					val processed = farcasterPaymentBotService.reply(castText,
							payment.getSourceHash(),
							embeds);

					if (!processed) {
						log.error("Failed to reply with {} for payment intent completion", castText);
					}

					if (payment.getReceiver() != null) {
						try {
							val messageText = String.format("""
											 @%s, you've been gifted %s units of storage by @%s 🎉
																						
											 %s

											🔗 Source: %s
											🧾 Receipt: %s

											Install `🗄 Gift Storage` at app.payflow.me/actions
											p.s. join /payflow channel for updates 👀""",
									receiverFname,
									payment.getTokenAmount(),
									senderFname,
									storageUsageText,
									sourceRef,
									receiptUrl);
							val response = farcasterMessagingService.message(
									new DirectCastMessage(payment.getReceiverFid().toString(), messageText,
											UUID.randomUUID()));

							if (!response.result().success()) {
								log.error("Failed to send direct cast with {} for gift storage intent " +
										"completion", messageText);
							}
						} catch (Throwable t) {
							log.error("Failed to send direct cast with exception: ", t);
						}
					}
				}
			}
		}
	}

	@PutMapping("/{referenceId}/cancel")
	@ResponseStatus(HttpStatus.OK)
	public void cancelPayment(@PathVariable String referenceId, Principal principal) {
		log.debug("Marking pending payment {} as cancelled by user {}", referenceId,
				principal.getName());

		val user = userService.findByIdentity(principal.getName());

		if (user == null) {
			return;
		}

		val payment = paymentRepository.findByReferenceIdAndSender(referenceId, user);
		if (payment != null) {
			payment.setStatus(Payment.PaymentStatus.CANCELLED);
			payment.setCompletedDate(new Date());
			log.debug("Payment was marked as cancelled: {}", payment);
		}
	}
}
