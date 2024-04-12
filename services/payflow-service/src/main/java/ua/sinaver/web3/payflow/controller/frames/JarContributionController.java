package ua.sinaver.web3.payflow.controller.frames;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.message.*;
import ua.sinaver.web3.payflow.repository.FlowRepository;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.FlowService;
import ua.sinaver.web3.payflow.service.TransactionService;
import ua.sinaver.web3.payflow.service.XmtpValidationService;
import ua.sinaver.web3.payflow.service.api.IFarcasterHubService;
import ua.sinaver.web3.payflow.service.api.IFrameService;
import ua.sinaver.web3.payflow.service.api.IUserService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import static ua.sinaver.web3.payflow.controller.frames.FramesController.DEFAULT_HTML_RESPONSE;
import static ua.sinaver.web3.payflow.service.TransactionService.*;

@RestController
@RequestMapping("/farcaster/frames/jar")
@Transactional
@Slf4j
public class JarContributionController {

	private static final String PAY_JAR_PATH = "/api/farcaster/frames/jar/%s/contribute";

	private static final String CHOOSE_CHAIN_PATH = PAY_JAR_PATH +
			"/chain";
	private static final String CHOOSE_AMOUNT_PATH = PAY_JAR_PATH +
			"/amount";
	private static final String CONFIRM_PATH = PAY_JAR_PATH +
			"/confirm";
	private static final String COMMENT_PATH = PAY_JAR_PATH +
			"/comment";
	private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
	@Autowired
	private IFarcasterHubService farcasterHubService;
	@Autowired
	private IUserService userService;
	@Value("${payflow.dapp.url}")
	private String dAppServiceUrl;
	@Value("${payflow.api.url}")
	private String apiServiceUrl;
	@Value("${payflow.frames.url}")
	private String framesServiceUrl;

	@Autowired
	private IFrameService frameService;

	@Autowired
	private TransactionService transactionService;

	@Autowired
	private PaymentRepository paymentRepository;

	@Autowired
	private FlowService flowService;

	@Autowired
	private FlowRepository flowRepository;

	@Autowired
	private XmtpValidationService xmtpValidationService;

	private static String roundTokenAmount(double amount) {
		val scale = amount < 1.0 ? 5 : 1;
		val amountInDecimals = BigDecimal.valueOf(amount);
		val roundedAmount = amountInDecimals.setScale(scale, RoundingMode.HALF_UP).toString();
		log.debug("roundTokenAmount: before {} after {} with scale {}", amountInDecimals, roundedAmount, scale);
		return roundedAmount;
	}

	@PostMapping("/{uuid}/contribute")
	public ResponseEntity<?> contribute(@PathVariable String uuid,
	                                    @RequestBody FrameMessage frameMessage) {
		log.debug("Received contribute jar {} in frame message request: {}",
				uuid, frameMessage);

		ValidatedFarcasterFrameMessage validatedFarcasterMessage = null;
		ValidatedXmtpFrameMessage validatedXmtpFrameMessage = null;

		if (frameMessage.clientProtocol() != null &&
				frameMessage.clientProtocol().startsWith("xmtp")) {
			validatedXmtpFrameMessage = xmtpValidationService.validateMessage(frameMessage);
			log.debug("Validation xmtp frame message response {} received on url: {}  ",
					validatedXmtpFrameMessage,
					validatedXmtpFrameMessage.actionBody().frameUrl());

			if (StringUtils.isBlank(validatedXmtpFrameMessage.verifiedWalletAddress())) {
				log.error("Xmtp frame message failed validation (missing verifiedWalletAddress) {}",
						validatedXmtpFrameMessage);
				return DEFAULT_HTML_RESPONSE;
			}
		} else {
			validatedFarcasterMessage = farcasterHubService.validateFrameMessageWithNeynar(
					frameMessage.trustedData().messageBytes());

			log.debug("Validation farcaster frame message response {} received on url: {}  ",
					validatedFarcasterMessage,
					validatedFarcasterMessage.action().url());

			if (!validatedFarcasterMessage.valid()) {
				log.error("Frame message failed validation {}", validatedFarcasterMessage);
				return DEFAULT_HTML_RESPONSE;
			}
		}

		val jar = flowService.findJarByUUID(uuid);
		if (jar == null) {
			log.error("Jar doesn't exist: {}", uuid);
			return ResponseEntity.badRequest()
					.body(new FrameResponse.FrameError("Jar doesn't exist!"));
		}

		if (jar.flow().wallets().isEmpty()) {
			log.error("Jar doesn't have any chains supported : {}", jar);
			return ResponseEntity.internalServerError()
					.body(new FrameResponse.FrameError("No chain options available"));
		}

		val jarImage = framesServiceUrl.concat(String.format("/images/jar/%s" +
				"/image.png?step=chain", uuid));

		val frameResponseBuilder = FrameResponse.builder()
				.imageUrl(jarImage)
				.postUrl(apiServiceUrl.concat(String.format(CHOOSE_CHAIN_PATH, uuid)));
		jar.flow().wallets().forEach(wallet -> {
			val chainId = wallet.network();
			if (PAYMENT_CHAIN_NAMES.containsKey(chainId))
				frameResponseBuilder.button(new FrameButton(PAYMENT_CHAIN_NAMES.get(chainId).toUpperCase(),
						FrameButton.ActionType.POST,
						null));
		});

		return frameResponseBuilder.build().toHtmlResponse();
	}

	@PostMapping("/{uuid}/contribute/chain")
	public ResponseEntity<?> chooseChain(@PathVariable String uuid,
	                                     @RequestBody FrameMessage frameMessage) {
		log.debug("Received contribute jar {} in frame message request: {}",
				uuid, frameMessage);

		ValidatedFarcasterFrameMessage validatedFarcasterMessage;
		ValidatedXmtpFrameMessage validatedXmtpFrameMessage;

		int buttonIndex;

		if (frameMessage.clientProtocol() != null &&
				frameMessage.clientProtocol().startsWith("xmtp")) {
			validatedXmtpFrameMessage = xmtpValidationService.validateMessage(frameMessage);
			log.debug("Validation xmtp frame message response {} received on url: {}  ",
					validatedXmtpFrameMessage,
					validatedXmtpFrameMessage.actionBody().frameUrl());

			if (StringUtils.isBlank(validatedXmtpFrameMessage.verifiedWalletAddress())) {
				log.error("Xmtp frame message failed validation (missing verifiedWalletAddress) {}",
						validatedXmtpFrameMessage);
				return DEFAULT_HTML_RESPONSE;
			}

			buttonIndex = validatedXmtpFrameMessage.actionBody().buttonIndex();
		} else {
			validatedFarcasterMessage = farcasterHubService.validateFrameMessageWithNeynar(
					frameMessage.trustedData().messageBytes());

			log.debug("Validation farcaster frame message response {} received on url: {}  ",
					validatedFarcasterMessage,
					validatedFarcasterMessage.action().url());

			if (!validatedFarcasterMessage.valid()) {
				log.error("Frame message failed validation {}", validatedFarcasterMessage);
				return DEFAULT_HTML_RESPONSE;
			}

			buttonIndex = validatedFarcasterMessage.action().tappedButton().index();
		}

		val jar = flowService.findJarByUUID(uuid);
		if (jar == null) {
			log.error("Jar doesn't exist: {}", uuid);
			return ResponseEntity.badRequest()
					.body(new FrameResponse.FrameError("Jar doesn't exist!"));
		}

		if (jar.flow().wallets().isEmpty()) {
			log.error("Jar doesn't have any chains supported : {}", jar);
			return ResponseEntity.internalServerError()
					.body(new FrameResponse.FrameError("No chain options available"));
		}

		if (buttonIndex > jar.flow().wallets().size()) {
			log.error("Selected chain index not accepted: {} in {}", buttonIndex, jar);
			return ResponseEntity.badRequest()
					.body(new FrameResponse.FrameError("Selected chain not accepted!"));
		}

		val receivingJarWallet = jar.flow().wallets().get(buttonIndex - 1);

		if (!PAYMENT_CHAIN_NAMES.containsKey(receivingJarWallet.network())) {
			log.error("Selected chain id not allowed for payments: {} in {}",
					receivingJarWallet.network(), jar);
			return ResponseEntity.badRequest()
					.body(new FrameResponse.FrameError("Selected chain not supported!"));
		}

		val jarImage = framesServiceUrl.concat(String.format("/images/jar/%s" +
				"/image.png?step=amount&chainId=%s", uuid, receivingJarWallet.network()));

		val state = gson.toJson(new FramePaymentMessage(receivingJarWallet.address(),
				receivingJarWallet.network(), null,
				null, null));

		val frameResponseBuilder = FrameResponse.builder()
				.imageUrl(jarImage)
				.textInput("Enter amount, $ (1-100)")
				.postUrl(apiServiceUrl.concat(String.format(CHOOSE_AMOUNT_PATH, uuid)))
				.state(Base64.getEncoder().encodeToString(state.getBytes()));

		val tokens = PAYMENTS_CHAIN_TOKENS.get(receivingJarWallet.network());
		tokens.forEach(token -> {
			frameResponseBuilder.button(new FrameButton(token.toUpperCase(), FrameButton.ActionType.POST, null));
		});

		return frameResponseBuilder.build().toHtmlResponse();
	}

	@PostMapping("/{uuid}/contribute/amount")
	public ResponseEntity<?> chooseAmount(@PathVariable String uuid,
	                                      @RequestBody FrameMessage frameMessage) {
		log.debug("Received enter contribution amount message request: {}", frameMessage);

		int buttonIndex;
		String state;
		FramePaymentMessage paymentState;
		String inputText;
		List<String> clickedProfileAddresses;

		String sourceApp;
		String sourceRef;

		ValidatedFarcasterFrameMessage validatedFarcasterMessage;
		ValidatedXmtpFrameMessage validatedXmtpFrameMessage;

		if (frameMessage.clientProtocol() != null &&
				frameMessage.clientProtocol().startsWith("xmtp")) {
			validatedXmtpFrameMessage = xmtpValidationService.validateMessage(frameMessage);
			log.debug("Validation xmtp frame message response {} received on url: {}  ",
					validatedXmtpFrameMessage,
					validatedXmtpFrameMessage.actionBody().frameUrl());

			if (StringUtils.isBlank(validatedXmtpFrameMessage.verifiedWalletAddress())) {
				log.error("Xmtp frame message failed validation (missing verifiedWalletAddress) {}",
						validatedXmtpFrameMessage);
				return DEFAULT_HTML_RESPONSE;
			}
			clickedProfileAddresses = Collections.singletonList(validatedXmtpFrameMessage.verifiedWalletAddress());
			buttonIndex = validatedXmtpFrameMessage.actionBody().buttonIndex();
			inputText = validatedXmtpFrameMessage.actionBody().inputText();
			sourceApp = "Xmtp";
			sourceRef = null; // maybe link the chat of the user who paid? or conversation?
			state = validatedXmtpFrameMessage.actionBody().state();
		} else {
			validatedFarcasterMessage = farcasterHubService.validateFrameMessageWithNeynar(
					frameMessage.trustedData().messageBytes());

			log.debug("Validation farcaster frame message response {} received on url: {}  ",
					validatedFarcasterMessage,
					validatedFarcasterMessage.action().url());

			if (!validatedFarcasterMessage.valid()) {
				log.error("Frame message failed validation {}", validatedFarcasterMessage);
				return DEFAULT_HTML_RESPONSE;
			}

			clickedProfileAddresses = frameService.getFidAddresses(
					validatedFarcasterMessage.action().interactor().fid());
			buttonIndex = validatedFarcasterMessage.action().tappedButton().index();
			inputText = validatedFarcasterMessage.action().input() != null ?
					validatedFarcasterMessage.action().input().text() : null;

			sourceApp = validatedFarcasterMessage.action().signer().client().displayName();
			val casterFid = validatedFarcasterMessage.action().cast().fid();
			val casterFcName = frameService.getFidFname(casterFid);
			// maybe would make sense to reference top cast instead (if it's a bot cast)
			sourceRef = String.format("https://warpcast.com/%s/%s",
					casterFcName, validatedFarcasterMessage.action().cast().hash().substring(0,
							10));
			state = validatedFarcasterMessage.action().state().serialized();
		}

		paymentState = gson.fromJson(
				new String(Base64.getDecoder().decode(state)),
				FramePaymentMessage.class);

		val profiles = frameService.getFidProfiles(clickedProfileAddresses);

		val jar = flowService.findJarByUUID(uuid);


		if (jar == null) {
			log.error("Jar doesn't exist: {}", uuid);
			return ResponseEntity.badRequest()
					.body(new FrameResponse.FrameError("Jar doesn't exist!"));
		}

		if (jar.flow().wallets().isEmpty()) {
			log.error("Jar doesn't have any chains supported : {}", jar);
			return ResponseEntity.internalServerError()
					.body(new FrameResponse.FrameError("No chain options available"));
		}

		if (paymentState == null) {
			log.error("Absent payment state for {}", jar);
			return ResponseEntity.internalServerError()
					.body(new FrameResponse.FrameError("Absent payment state"));
		}

		log.debug("Previous payment state: {}", paymentState);

		if (!PAYMENT_CHAIN_NAMES.containsKey(paymentState.chainId())) {
			log.error("Selected chain id not allowed for payments: {} in {}",
					paymentState.chainId(), jar);
			return ResponseEntity.badRequest()
					.body(new FrameResponse.FrameError("Selected chain not supported!"));
		}

		val tokens = PAYMENTS_CHAIN_TOKENS.get(paymentState.chainId());

		if (buttonIndex > tokens.size()) {
			log.error("Selected token index not accepted: {} in {}", buttonIndex, jar);
			return ResponseEntity.badRequest()
					.body(new FrameResponse.FrameError("Selected token not accepted!"));
		}

		Double usdAmount = null;
		if (StringUtils.isNotBlank(inputText)) {
			try {
				val parsedAmount = Double.parseDouble(inputText);
				if (parsedAmount > 0 && parsedAmount <= 100.0) {
					usdAmount = parsedAmount;
				} else {
					log.error("Parsed input token amount {} is not within the valid range" +
							" (1-100)", parsedAmount);
				}
			} catch (NumberFormatException ignored) {
				log.error("Failed to parse input token amount.");
			}
		}

		if (usdAmount == null) {
			log.warn("Amount wasn't entered");
			return ResponseEntity.badRequest()
					.body(new FrameResponse.FrameError("Enter amount again!"));
		}

		val token = tokens.get(buttonIndex - 1);
		val tokenAmount = roundTokenAmount(
				usdAmount / transactionService.getPrice(token));

		val profile = userService.findByIdentity(jar.profile().identity());
		val payment = new Payment(Payment.PaymentType.FRAME, profile,
				paymentState.chainId(), token);

		// TODO: refactor to fetch jar data object instead of message
		val flow = flowRepository.findByUuid(uuid);
		payment.setReceiverFlow(flow);

		payment.setUsdAmount(usdAmount.toString());
		payment.setSourceApp(sourceApp);
		payment.setSourceRef(sourceRef);

		paymentRepository.save(payment);

		val refId = payment.getReferenceId();
		val updatedState = gson.toJson(new FramePaymentMessage(paymentState.address(),
				paymentState.chainId(), token, usdAmount, refId));
		val jarImage = framesServiceUrl.concat(String.format("/images/jar/%s" +
						"/image.png?step=confirm&chainId=%s&token=%s&usdAmount=%s&amount=%s",
				uuid, paymentState.chainId(), token, usdAmount, tokenAmount));
		val frameResponseBuilder = FrameResponse.builder()
				.postUrl(apiServiceUrl.concat(String.format(CONFIRM_PATH, uuid)))
				.button(new FrameButton("\uD83D\uDC9C Contribute",
						FrameButton.ActionType.TX,
						apiServiceUrl.concat(String.format(CONFIRM_PATH, uuid))))
				.imageUrl(jarImage)
				.state(Base64.getEncoder().encodeToString(updatedState.getBytes()));

		// for now just check if profile exists
		if (!profiles.isEmpty()) {
			frameResponseBuilder.button(new FrameButton("\uD83D\uDCF1 Later",
					FrameButton.ActionType.POST,
					apiServiceUrl.concat(String.format(CONFIRM_PATH, uuid))));
		}

		return frameResponseBuilder.build().toHtmlResponse();
	}

	@PostMapping("/{uuid}/contribute/confirm")
	public ResponseEntity<String> confirm(@PathVariable String uuid,
	                                      @RequestBody FrameMessage frameMessage) {
		log.debug("Received contribution confirm message request: {}", frameMessage);
		int buttonIndex;
		FramePaymentMessage paymentState;
		List<String> clickedProfileAddresses;
		String transactionId = null;
		String state;

		ValidatedFarcasterFrameMessage validatedFarcasterMessage;
		ValidatedXmtpFrameMessage validatedXmtpFrameMessage;

		if (frameMessage.clientProtocol() != null &&
				frameMessage.clientProtocol().startsWith("xmtp")) {
			validatedXmtpFrameMessage = xmtpValidationService.validateMessage(frameMessage);
			log.debug("Validation xmtp frame message response {} received on url: {}  ",
					validatedXmtpFrameMessage,
					validatedXmtpFrameMessage.actionBody().frameUrl());

			if (StringUtils.isBlank(validatedXmtpFrameMessage.verifiedWalletAddress())) {
				log.error("Xmtp frame message failed validation (missing verifiedWalletAddress) {}",
						validatedXmtpFrameMessage);
				return DEFAULT_HTML_RESPONSE;
			}
			clickedProfileAddresses = Collections.singletonList(validatedXmtpFrameMessage.verifiedWalletAddress());
			buttonIndex = validatedXmtpFrameMessage.actionBody().buttonIndex();
			state = validatedXmtpFrameMessage.actionBody().state();
		} else {
			validatedFarcasterMessage = farcasterHubService.validateFrameMessageWithNeynar(
					frameMessage.trustedData().messageBytes());

			log.debug("Validation farcaster frame message response {} received on url: {}  ",
					validatedFarcasterMessage,
					validatedFarcasterMessage.action().url());

			if (!validatedFarcasterMessage.valid()) {
				log.error("Frame message failed validation {}", validatedFarcasterMessage);
				return DEFAULT_HTML_RESPONSE;
			}

			clickedProfileAddresses = frameService.getFidAddresses(
					validatedFarcasterMessage.action().interactor().fid());
			buttonIndex = validatedFarcasterMessage.action().tappedButton().index();
			state = validatedFarcasterMessage.action().state().serialized();
			transactionId = validatedFarcasterMessage.action().transaction() != null ?
					validatedFarcasterMessage.action().transaction().hash() : null;
		}

		paymentState = gson.fromJson(
				new String(Base64.getDecoder().decode(state)),
				FramePaymentMessage.class);
		val profiles = frameService.getFidProfiles(clickedProfileAddresses);
		val jar = flowService.findJarByUUID(uuid);

		if (jar != null && state != null) {
			log.debug("Previous payment state: {}", state);
			if (isFramePaymentMessageComplete(paymentState)) {
				val flowWalletAddress = jar.flow().wallets().stream()
						.filter(wallet -> wallet.network() == paymentState.chainId())
						.map(WalletMessage::address).findFirst().orElse(null);

				if (!paymentState.address().equals(flowWalletAddress)) {
					log.error("Transaction address doesn't match jar's wallet address: " +
							"{} vs {}", paymentState.address(), flowWalletAddress);
					return DEFAULT_HTML_RESPONSE;
				}

				val refId = paymentState.refId();
				val payment = paymentRepository.findByReferenceId(refId);
				if (payment == null) {
					log.error("Payment was not found for refId {}", refId);
					return DEFAULT_HTML_RESPONSE;
				} else if (!payment.getStatus().equals(Payment.PaymentStatus.PENDING)) {
					log.error("Payment is not in pending state {} - {}", refId, payment);
					return DEFAULT_HTML_RESPONSE;
				}

				// handle transaction execution result
				if (!StringUtils.isBlank(transactionId)) {
					log.debug("Handling tx id {} for {}", transactionId, state);
					// TODO: check tx execution status
					payment.setHash(transactionId);
					payment.setStatus(Payment.PaymentStatus.COMPLETED);
					payment.setCompletedDate(new Date());

					log.debug("Updated payment for ref: {} - {}", refId, payment);

					val tokenAmount = roundTokenAmount(
							paymentState.usdAmount() / transactionService.getPrice(paymentState.token()));
					val jarImage = framesServiceUrl.concat(String.format("/images/jar/%s" +
									"/image.png?step=execute&chainId=%s&token=%s&usdAmount=%s" +
									"&amount=%s&status=%s", uuid, paymentState.chainId(), paymentState.token(),
							paymentState.usdAmount(), tokenAmount, "success"));
					return FrameResponse.builder()
							.imageUrl(jarImage)
							.textInput("Enter your comment")
							.button(new FrameButton("\uD83D\uDCAC Add comment",
									FrameButton.ActionType.POST,
									apiServiceUrl.concat(String.format(COMMENT_PATH, uuid))))
							.button(new FrameButton("\uD83D\uDD0E Check tx details",
									FrameButton.ActionType.LINK,
									"https://basescan.org/tx/" + transactionId))
							.state(state)
							.build().toHtmlResponse();
				} else if (buttonIndex == 1) {
					log.debug("Handling payment through frame tx: {}", state);
					val callData = transactionService.generateTxCallData(paymentState);
					log.debug("Returning callData for tx payment: {} - {}", callData, state);
					return ResponseEntity.ok()
							.contentType(MediaType.APPLICATION_JSON)
							.body(callData);

				} else if (buttonIndex == 2) {
					log.debug("Submitting payment for later in app execution: {}", state);
					// TODO: for now set the first
					payment.setSender(profiles.getFirst());
					payment.setType(Payment.PaymentType.INTENT);
					val tokenAmount = roundTokenAmount(
							paymentState.usdAmount() / transactionService.getPrice(paymentState.token()));
					val jarImage = framesServiceUrl.concat(String.format("/images/jar/%s" +
									"/image.png?step=execute&chainId=%s&token=%s&usdAmount=%s" +
									"&amount=%s",
							uuid, paymentState.chainId(), paymentState.token(),
							paymentState.usdAmount(), tokenAmount));
					return FrameResponse.builder()
							.imageUrl(jarImage)
							.button(new FrameButton("\uD83D\uDCF1 Payflow",
									FrameButton.ActionType.LINK, dAppServiceUrl))
							.build().toHtmlResponse();
				}
			} else {
				log.error("Frame payment message is not complete or valid: {}", state);
			}
		}

		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/{uuid}/contribute/comment")
	public ResponseEntity<String> comment(@PathVariable String uuid,
	                                      @RequestBody FrameMessage frameMessage) {
		log.debug("Received contribution comment message request: {}", frameMessage);
		val validateMessage =
				farcasterHubService.validateFrameMessageWithNeynar(
						frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val buttonIndex = validateMessage.action().tappedButton().index();
		val jar = flowService.findJarByUUID(uuid);
		var state = gson.fromJson(
				new String(Base64.getDecoder().decode(validateMessage.action().state().serialized())),
				FramePaymentMessage.class);

		if (jar != null && state != null) {
			log.debug("Previous payment state: {}", state);

			if (isFramePaymentMessageComplete(state)) {
				val refId = state.refId();
				val payment = paymentRepository.findByReferenceId(refId);
				if (payment == null) {
					log.error("Payment was not found for refId {}", refId);
					return DEFAULT_HTML_RESPONSE;
				}

				if (buttonIndex == 1 && payment.getStatus().equals(Payment.PaymentStatus.COMPLETED) &&
						StringUtils.isBlank(payment.getComment())) {
					log.debug("Handling add comment for payment: {}", payment);
					// TODO: optimize
					val tokenAmount = roundTokenAmount(
							state.usdAmount() / transactionService.getPrice(state.token()));
					val jarImage = framesServiceUrl.concat(String.format("/images/jar/%s" +
									"/image.png?step=execute&chainId=%s&token=%s&usdAmount=%s" +
									"&amount=%s&status=%s",
							uuid, state.chainId(), state.token(),
							state.usdAmount(), tokenAmount, "success"));

					val frameResponseBuilder = FrameResponse.builder()
							.imageUrl(jarImage)
							.button(new FrameButton("\uD83D\uDD0E Check tx details",
									FrameButton.ActionType.LINK,
									"https://basescan.org/tx/" + payment.getHash()))
							.state(validateMessage.action().state().serialized());

					val input = validateMessage.action().input();

					val comment = input != null ? input.text() : null;
					if (!StringUtils.isBlank(comment)) {
						payment.setComment(comment);
					} else {
						frameResponseBuilder.textInput("Enter your comment again")
								.button(new FrameButton("\uD83D\uDCAC Add comment",
										FrameButton.ActionType.POST,
										apiServiceUrl.concat(String.format(COMMENT_PATH, uuid))));
					}
					return frameResponseBuilder.build().toHtmlResponse();
				}
			} else {
				log.debug("Frame payment message is not complete or valid: {}", state);
			}
		}

		return DEFAULT_HTML_RESPONSE;
	}
}
