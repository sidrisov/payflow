package ua.sinaver.web3.payflow.controller.protocol;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.WalletSession;
import ua.sinaver.web3.payflow.data.protocol.ClientApiKey;
import ua.sinaver.web3.payflow.message.protocol.CreatePaymentRequest;
import ua.sinaver.web3.payflow.message.protocol.CreatePaymentResponse;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.repository.WalletSessionRepository;
import ua.sinaver.web3.payflow.service.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

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
	private TransactionService transactionService;

	@Autowired
	private WalletSessionRepository walletSessionRepository;

	@Autowired
	private ObjectMapper objectMapper;

	@PostMapping("/create")
	public CreatePaymentResponse createPayment(
			@AuthenticationPrincipal ClientApiKey clientApiKey,
			@RequestBody CreatePaymentRequest request) {

		log.info("Creating payment via protocol for client: {} ({}), request: {}",
				clientApiKey.getName(),
				clientApiKey.getClientIdentifier(),
				request);

		try {
			// Validate request
			if ((request.recipient() == null || request.payment() == null)) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
			}

			var recipientAddress = request.recipient().address();
			val social = request.recipient().social();

			if (social == null && recipientAddress == null) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "missing recipient");
			}

			var walletSession = (WalletSession) null;
			if (Payment.PaymentType.SESSION_INTENT.equals(request.type())) {
				if (request.payer() == null || request.payer().sessionId() == null) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"sessionId should be specified for type=session_intent");
				}
				// find sessionId exists
				walletSession = walletSessionRepository.findOneBySessionIdAndActiveTrue(
						request.payer().sessionId());
				if (walletSession == null) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"sessionId not found");
				}

				// Verify session belongs to API key's user if userId is set
				if (clientApiKey.getUserId() == null ||
						!clientApiKey.getUserId().equals(walletSession.getWallet().getFlow().getUserId())) {
					throw new ResponseStatusException(HttpStatus.FORBIDDEN,
							"sessionId does not belong to API key's user");
				}
			}

			var recipientIdentity = (String) null;
			if (social != null && social.type() != null && social.identifier() != null) {
				if (social.type().equals("ens")) {
					recipientIdentity = identityService.getENSAddress(social.identifier());
					if (recipientIdentity == null) {
						throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
								"Couldn't resolve recipient by ENS");
					}
				} else if (social.type().equals("farcaster")) {
					var addresses = social.identifier().startsWith(
							"fid:") ? identityService.getFidAddresses(Integer.parseInt(social.identifier().replace(
							"fid:", ""))) : identityService.getFnameAddresses(social.identifier());

					if (addresses == null || addresses.isEmpty()) {
						throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
								"Couldn't resolve recipient by Farcaster");
					}
					val identity = identityService.getHighestScoredIdentityInfo(addresses);
					if (identity != null) {
						recipientIdentity = identity.address();
					}
				}
			} else {
				recipientIdentity = recipientAddress;
			}

			if (recipientIdentity == null) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Couldn't determine recipient identity");
			}

			var recipientFid = identityService.getIdentityFid(recipientIdentity);
			val receiverProfile = userService.findByIdentity(recipientIdentity);

			if (recipientAddress == null) {
				if (receiverProfile != null && receiverProfile.isAllowed()) {
					recipientAddress = paymentService.getUserReceiverAddress(receiverProfile,
							request.payment().chainId());
				} else {
					recipientAddress = recipientIdentity;
				}
			}

			if (recipientAddress == null) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Couldn't determine recipient address");
			}

			val payment = new Payment(
					request.type(),
					receiverProfile,
					request.payment().chainId(),
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
			} else {
				val txParams = transactionService.generateTxParams(payment);
				val callsNode = objectMapper.valueToTree(List.of(txParams));
				payment.setCalls(callsNode);
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

			paymentRepository.saveAndFlush(payment);
			paymentService.asyncProcessSessionIntentPayment(payment.getId());
			log.debug("Saved payment: {}", payment);


			val paymentUrl = linkService.paymentLink(payment, false).toString();
			return new CreatePaymentResponse(payment.getReferenceId(), paymentUrl);

		} catch (ResponseStatusException e) {
			throw e;
		} catch (Throwable e) {
			log.error("Error creating payment for client: {}", clientApiKey.getClientIdentifier(), e);
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
