package ua.sinaver.web3.payflow.controller.protocol;

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
import ua.sinaver.web3.payflow.data.protocol.ClientApiKey;
import ua.sinaver.web3.payflow.message.protocol.CreatePaymentRequest;
import ua.sinaver.web3.payflow.message.protocol.CreatePaymentResponse;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.LinkService;
import ua.sinaver.web3.payflow.service.UserService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/protocol/payment")
public class ClientPaymentController {
	@Autowired
	private UserService userService;
	@Autowired
	private PaymentRepository paymentRepository;

	@Autowired
	private LinkService linkService;

	@PostMapping("/create")
	public ResponseEntity<CreatePaymentResponse> createPayment(
			@AuthenticationPrincipal ClientApiKey clientApiKey,
			@RequestBody CreatePaymentRequest request) {

		log.info("Creating payment via protocol for client: {} ({}), request: {}",
				clientApiKey.getName(),
				clientApiKey.getClientIdentifier(),
				request);

		try {
			// Validate request
			if (request.type() == null || request.recipients() == null || request.recipients().isEmpty()
					|| request.payment() == null) {
				return ResponseEntity.badRequest().build();
			}

			// For now handle only first recipient
			val recipient = request.recipients().getFirst();
			val receiverIdentity = recipient.social() != null ? recipient.social().identifier() : null;

			val receiver = receiverIdentity != null
					? userService.findByIdentity(receiverIdentity)
					: null;

			val payment = new Payment(
					Payment.PaymentType.valueOf(request.type().toUpperCase()),
					receiver,
					request.payment().chain(),
					request.payment().token()
			);

			payment.setName(request.name());
			payment.setReceiverAddress(recipient.address());
			payment.setTokenAmount(request.payment().amount());
			payment.setStatus(Payment.PaymentStatus.CREATED);
			payment.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));  // Changed to 1 week

			if (StringUtils.isNotBlank(recipient.comment())) {
				payment.setComment(recipient.comment());
			}

			/*if (StringUtils.isNotBlank(request.name())) {
				payment.setName(request.name());
			}*/

			if (request.source() != null) {
				payment.setSourceApp("warpcast");
				payment.setSourceRef(request.source().link());
			}

			paymentRepository.save(payment);

			log.debug("Saved payment: {}", payment);

			val paymentUrl = linkService.paymentLink(payment, false).toString();
			val frameUrl = linkService.framePaymentLink(payment, false).toString();
			return ResponseEntity.ok(new CreatePaymentResponse(
					payment.getReferenceId(), paymentUrl, frameUrl));

		} catch (Exception e) {
			log.error("Error creating payment for client: " + clientApiKey.getClientIdentifier(), e);
			return ResponseEntity.badRequest().build();
		}
	}
}
