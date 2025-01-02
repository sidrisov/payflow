package ua.sinaver.web3.payflow.controller.protocol;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.WalletSession;
import ua.sinaver.web3.payflow.data.protocol.ClientApiKey;
import ua.sinaver.web3.payflow.message.protocol.CreatePaymentRequest;
import ua.sinaver.web3.payflow.message.protocol.CreatePaymentResponse;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.repository.WalletSessionRepository;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.LinkService;
import ua.sinaver.web3.payflow.service.PaymentService;
import ua.sinaver.web3.payflow.service.UserService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/protocol/payment")
@Transactional
public class ClientPaymentController {
	@Autowired
	private UserService userService;
	@Autowired
	private PaymentRepository paymentRepository;

	@Autowired
	private IdentityService identityService;

	@Autowired
	private LinkService linkService;

	@Autowired
	private PaymentService paymentService;

	@Autowired
	private WalletSessionRepository walletSessionRepository;

	@PostMapping("/create")
	public ResponseEntity<?> createPayment(
			@AuthenticationPrincipal ClientApiKey clientApiKey,
			@RequestBody CreatePaymentRequest request) {

		log.info("Creating payment via protocol for client: {} ({}), request: {}",
				clientApiKey.getName(),
				clientApiKey.getClientIdentifier(),
				request);

		try {
			// Validate request
			if ((request.recipient() == null || request.payment() == null)) {
				return ResponseEntity.badRequest().build();
			}

			var recipientAddress = request.recipient().address();
			val social = request.recipient().social();

			if (social == null && recipientAddress == null) {
				return ResponseEntity.badRequest().body("missing recipient");
			}

			var walletSession = (WalletSession) null;
			if (Payment.PaymentType.SESSION_INTENT.equals(request.type())) {
				if (request.payer() == null || request.payer().sessionId() == null) {
					return ResponseEntity.badRequest().body(
							"sessionId should be specified for type=session_intent");
				}
				// find sessionId exists
				walletSession = walletSessionRepository.findOneBySessionIdAndActiveTrue(
						request.payer().sessionId());
				if (walletSession == null) {
					return ResponseEntity.badRequest().body("sessionId not found");
				}
			}

			var recipientIdentity = (String) null;
			if (social != null && social.type() != null && social.identifier() != null) {
				if (social.type().equals("ens")) {
					recipientIdentity = identityService.getENSAddress(social.identifier());
				} else if (social.type().equals("farcaster")) {
					var addresses = social.identifier().startsWith(
							"fid:") ? identityService.getFidAddresses(Integer.parseInt(social.identifier().replace(
							"fid:", ""))) : identityService.getFnameAddresses(social.identifier());
					val identity = identityService.getHighestScoredIdentityInfo(addresses);
					if (identity != null) {
						recipientIdentity = identity.address();
					}
				}
			} else {
				recipientIdentity = recipientAddress;
			}

			var recipientFid = identityService.getIdentityFid(recipientIdentity);

			val receiverProfile = userService.findByIdentity(recipientIdentity);

			if (recipientAddress == null) {
				if (receiverProfile != null && receiverProfile.isAllowed()) {
					recipientAddress = paymentService.getUserReceiverAddress(receiverProfile,
							request.payment().chain());
				} else {
					recipientAddress = recipientIdentity;
				}
			}

			val payment = new Payment(
					request.type(),
					receiverProfile,
					request.payment().chain(),
					request.payment().token());

			payment.setName(request.name());
			payment.setReceiverAddress(recipientAddress);
			payment.setReceiverFid(recipientFid != null ? Integer.parseInt(recipientFid) : null);
			payment.setTokenAmount(request.payment().amount());
			payment.setStatus(Payment.PaymentStatus.CREATED);
			payment.setExpiresAt(request.expiresAt() != null ? request.expiresAt()
					: Instant.now().plus(7,
					ChronoUnit.DAYS));
			if (StringUtils.isNotBlank(request.recipient().comment())) {
				payment.setComment(request.recipient().comment());
			}

			if (request.payment().calls() != null) {
				payment.setCalls(request.payment().calls());
			}

			if (walletSession != null) {
				payment.setWalletSession(walletSession);
				val userId = walletSession.getWallet().getFlow().getUserId();
				val user = userService.findById(userId);
				payment.setSender(user);
			}

			payment.setName(request.name());

			if (request.source() != null) {
				payment.setSourceApp("warpcast");
				payment.setSourceRef(request.source().url());
			}

			paymentRepository.save(payment);

			log.debug("Saved payment: {}", payment);

			val paymentUrl = linkService.paymentLink(payment, false).toString();
			val frameUrl = linkService.framePaymentLink(payment).toString();
			return ResponseEntity.ok(new CreatePaymentResponse(
					payment.getReferenceId(), paymentUrl, frameUrl));

		} catch (Throwable e) {
			log.error("Error creating payment for client: {}", clientApiKey.getClientIdentifier(), e);
			return ResponseEntity.badRequest().build();
		}
	}
}
