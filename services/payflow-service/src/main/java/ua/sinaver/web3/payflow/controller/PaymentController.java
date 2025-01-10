package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.message.PaymentMessage;
import ua.sinaver.web3.payflow.message.PaymentReferenceMessage;
import ua.sinaver.web3.payflow.message.PaymentUpdateMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.ContactBookService;
import ua.sinaver.web3.payflow.service.FarcasterNeynarService;
import ua.sinaver.web3.payflow.service.NotificationService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.service.api.IUserService;

import java.security.Principal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;

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
	private IIdentityService identityService;

	@Autowired
	private ContactBookService contactBookService;

	@Autowired
	private NotificationService notificationService;

	@Autowired
	private FarcasterNeynarService neynarService;

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

	@PostMapping
	public ResponseEntity<PaymentReferenceMessage> submitPayment(@RequestBody PaymentMessage paymentMessage,
			Principal principal) {
		val username = principal != null ? principal.getName() : null;

		log.debug("Saving completed payment {} for {}", paymentMessage, username);

		if (StringUtils.isBlank(username)) {
			log.error("User not authenticated!");
			return ResponseEntity.badRequest().build();
		}

		val user = userService.findByUsername(username);
		if (user == null) {
			log.error("User not found!");
			return ResponseEntity.badRequest().build();
		}

		val receiver = paymentMessage.receiver() != null
				? userService.findByIdentity(paymentMessage.receiver().identity())
				: null;
		val payment = new Payment(paymentMessage.type(), receiver,
				paymentMessage.chainId(), paymentMessage.token());
		payment.setReceiverAddress(paymentMessage.receiverAddress());
		payment.setSender(user);
		payment.setTokenAmount(paymentMessage.tokenAmount().toString());

		val isCompleted = Payment.PaymentStatus.COMPLETED.equals(paymentMessage.status())
				&& paymentMessage.hash() != null;
		if (isCompleted) {
			payment.setHash(paymentMessage.hash());
			payment.setStatus(paymentMessage.status());
			payment.setCompletedAt(Instant.now());
			if (StringUtils.isNotBlank(paymentMessage.comment())) {
				payment.setComment(paymentMessage.comment());
			}
		} else {
			payment.setStatus(Payment.PaymentStatus.CREATED);
			payment.setExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));
		}

		paymentRepository.save(payment);
		if (isCompleted) {
			notificationService.notifyPaymentCompletion(payment, user);
			// TODO: move to event system
			contactBookService.cleanContactsCache(user);
		}
		log.debug("Saved payment: {}", payment);
		return ResponseEntity.ok(new PaymentReferenceMessage(payment.getReferenceId()));
	}

	@GetMapping("/completed")
	public Page<PaymentMessage> completedPayments(Principal principal,
			@RequestParam(required = false) String identity,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		val loggedIdentity = principal != null ? principal.getName() : null;

		log.debug("Fetching completed payments for identity: {}, logged user: {}", identity, loggedIdentity);

		// If identity is not specified, use the logged user's identity
		if (StringUtils.isBlank(identity)) {
			identity = loggedIdentity;
		}

		val user = userService.findByIdentity(identity);
		if (user == null) {
			log.warn("User not found for identity: {}", identity);
			return Page.empty();
		}

		val verifications = identityService.getIdentityAddresses(user.getIdentity()).stream()
				.map(String::toLowerCase)
				.toList();

		val fid = identityService.getIdentityFid(user.getIdentity());

		val paymentsPage = paymentRepository.findAllCompletedOrderByCompletedAtDesc(user,
				verifications, fid != null ? Integer.parseInt(fid) : null, PageRequest.of(page,
						size));

		// Check if we should include comments (when logged user is viewing their own
		// payments)
		val includeComments = StringUtils.equalsIgnoreCase(identity, loggedIdentity);
		return paymentsPage.map(payment -> PaymentMessage.convert(payment, true, includeComments));
	}

	@GetMapping("/outbound")
	public Page<PaymentMessage> outbound(Principal principal,
			@RequestParam List<Payment.PaymentStatus> statuses,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "5") int size) {
		val username = principal != null ? principal.getName() : null;
		log.debug("Fetching pending payments for {} ", username);

		val user = userService.findByIdentity(username);
		if (user == null) {
			return Page.empty();
		}
		val verifications = identityService.getIdentityAddresses(user.getIdentity()).stream()
				.map(String::toLowerCase).toList();

		val paymentsPage = paymentRepository.findOutboundByStatusAndSenderOrderDesc(user,
				verifications, statuses,
				PageRequest.of(page, size));

		return paymentsPage.map(payment -> PaymentMessage.convert(payment, true, true));
	}

	@GetMapping("/{referenceId}")
	@ResponseStatus(HttpStatus.OK)
	public ResponseEntity<PaymentMessage> payment(@PathVariable String referenceId) {
		val payment = paymentRepository.findByReferenceId(referenceId);
		if (payment == null) {
			log.error("Payment doesn't exist: {}", referenceId);
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok(PaymentMessage.convert(payment, true, false));
	}

	@PutMapping("/{referenceId}")
	@ResponseStatus(HttpStatus.OK)
	public void updatePayment(@PathVariable String referenceId,
			@RequestBody PaymentUpdateMessage paymentUpdateMessage, Principal principal) {
		log.debug("Received update {} for payment {} by user {}",
				paymentUpdateMessage,
				referenceId,
				principal.getName());

		val user = userService.findByIdentity(principal.getName());

		if (user == null) {
			return;
		}

		val payment = paymentRepository.findByReferenceIdAndSender(referenceId, user);
		if (payment != null && !payment.getStatus().equals(Payment.PaymentStatus.COMPLETED) &&
				!payment.getStatus().equals(Payment.PaymentStatus.CANCELLED) &&
				!payment.getStatus().equals(Payment.PaymentStatus.REFUNDED)) {

			if (payment.getStatus().equals(Payment.PaymentStatus.CREATED)
					&& StringUtils.isNotBlank(paymentUpdateMessage.fulfillmentId())) {
				payment.setFulfillmentId(paymentUpdateMessage.fulfillmentId());
				if (paymentUpdateMessage.fulfillmentChainId() != null &&
						StringUtils.isNotBlank(paymentUpdateMessage.fulfillmentHash())) {
					payment.setFulfillmentChainId(paymentUpdateMessage.fulfillmentChainId());
					payment.setFulfillmentHash(paymentUpdateMessage.fulfillmentHash());
					payment.setStatus(Payment.PaymentStatus.INPROGRESS);
					if (payment.getCategory() != null && List.of("mint", "fan", "fc_storage",
							"hypersub").contains(payment.getCategory())) {
						payment.setTokenAmount(paymentUpdateMessage.tokenAmount().toString());
					}
				}
				log.debug("Updated payment: {}", payment);
				return;
			}

			// if it's not a fulfillment type of payment, save additionally chainId and
			// token
			if (!payment.getStatus().equals(Payment.PaymentStatus.INPROGRESS)) {
				if (paymentUpdateMessage.chainId() != null) {
					payment.setNetwork(paymentUpdateMessage.chainId());
				}
				if (paymentUpdateMessage.token() != null) {
					payment.setToken(paymentUpdateMessage.token());
				}
			}

			if (StringUtils.isNotBlank(paymentUpdateMessage.comment())) {
				payment.setComment(paymentUpdateMessage.comment());
			}

			payment.setHash(paymentUpdateMessage.hash());
			payment.setStatus(Payment.PaymentStatus.COMPLETED);
			payment.setCompletedAt(Instant.now());

			if (payment.getSender() == null) {
				payment.setSender(user);
			}

			notificationService.notifyPaymentCompletion(payment, user);

			// TODO: move to event system
			contactBookService.cleanContactsCache(user);
			if (StringUtils.equals(payment.getCategory(), "fc_storage")) {
				neynarService.clearStorageCache(payment.getReceiverFid());
			}

			log.debug("Payment was updated: {}", payment);
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
			payment.setCompletedAt(Instant.now());
			log.debug("Payment was marked as cancelled: {}", payment);
		}
	}
}
