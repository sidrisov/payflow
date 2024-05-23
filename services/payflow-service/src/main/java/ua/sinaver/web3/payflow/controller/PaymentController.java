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
import ua.sinaver.web3.payflow.message.CastEmbed;
import ua.sinaver.web3.payflow.message.PaymentHashMessage;
import ua.sinaver.web3.payflow.message.PaymentMessage;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.FarcasterMessagingService;
import ua.sinaver.web3.payflow.service.FarcasterPaymentBotService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.service.api.IUserService;

import java.security.Principal;
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

		return paymentRepository.findBySenderAndStatusAndTypeInOrderByCreatedDateDesc(
						user, Payment.PaymentStatus.PENDING,
						List.of(Payment.PaymentType.INTENT))
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

		if (!(payment.getType().equals(Payment.PaymentType.FRAME) || payment.getType().equals(Payment.PaymentType.INTENT))
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
				val receiverFname = identityService.getIdentityFname(payment.getReceiver() != null ?
						payment.getReceiver().getIdentity() :
						payment.getReceiverAddress() != null ? payment.getReceiverAddress() :
								"fc_fid:" + payment.getReceiverFid());
				val txUrl = String.format(
						"https://onceupon.gg/%s", payment.getHash());
				val embeds = Collections.singletonList(new CastEmbed(txUrl));
				val sourceRef = String.format("https://warpcast.com/%s/%s",
						receiverFname, payment.getSourceHash().substring(0, 10));

				if (StringUtils.isBlank(payment.getCategory())) {
					if (payment.getReceiver() == null) {
						val castText = String.format("""
										@%s, you've been paid $%s %s by @%s 🎉
																				
										Join /payflow community!""",
								receiverFname,
								payment.getUsdAmount(),
								payment.getToken(),
								senderFname);

						val processed = farcasterPaymentBotService.reply(castText,
								payment.getSourceHash(),
								embeds);

						if (!processed) {
							log.error("Failed to reply with {} for payment intent completion", castText);
						}
					} else {
						val receiverFid = identityService.getIdentityFid(payment.getReceiver().getIdentity(), true);
						if (StringUtils.isBlank(receiverFid)) {
							return;
						}

						try {
							val messageText = String.format("""
											 @%s, you've been paid $%s %s by @%s 🎉
																					
											Source (cast): %s
																					
											Receipt (tx): %s

											Join /payflow community!""",
									receiverFname,
									payment.getUsdAmount(),
									payment.getToken(),
									senderFname,
									sourceRef,
									txUrl);
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
				} else if (payment.getCategory().equals("fc_storage")) {
					if (payment.getReceiver() == null) {
						val castText = String.format("""
										@%s, you've been gifted 1 unit of storage by @%s 🎉
																				
										Join /payflow community!""",
								receiverFname,
								senderFname);

						val processed = farcasterPaymentBotService.reply(castText,
								payment.getSourceHash(),
								embeds);

						if (!processed) {
							log.error("Failed to reply with {} for payment intent completion", castText);
						}
					} else {
						try {
							val messageText = String.format("""
											 @%s, you've been gifted 1 unit of storage by @%s 🎉
																					
											Source (cast): %s
																					
											Receipt (tx): %s

											Join /payflow community!""",
									receiverFname,
									senderFname,
									sourceRef,
									txUrl);
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
