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
import ua.sinaver.web3.payflow.data.Wallet;
import ua.sinaver.web3.payflow.message.FrameButton;
import ua.sinaver.web3.payflow.message.FrameMessage;
import ua.sinaver.web3.payflow.message.FramePaymentMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.TransactionService;
import ua.sinaver.web3.payflow.service.api.IFarcasterHubService;
import ua.sinaver.web3.payflow.service.api.IFrameService;
import ua.sinaver.web3.payflow.service.api.IUserService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Base64;
import java.util.Date;

import static ua.sinaver.web3.payflow.controller.frames.FramesController.BASE_PATH;
import static ua.sinaver.web3.payflow.controller.frames.FramesController.DEFAULT_HTML_RESPONSE;
import static ua.sinaver.web3.payflow.service.TransactionService.*;

@RestController
@RequestMapping("/farcaster/frames/pay")
@Transactional
@Slf4j
public class FramePaymentController {

	public static final String PAY = BASE_PATH +
			"/pay/%s";
	private static final String PAY_IN_FRAME = BASE_PATH +
			"/pay/%s/frame";
	private static final String PAY_IN_FRAME_TOKEN = BASE_PATH +
			"/pay/%s/frame/token";
	private static final String PAY_IN_FRAME_AMOUNT = BASE_PATH +
			"/pay/%s/frame/amount";
	private static final String PAY_IN_FRAME_CONFIRM = BASE_PATH +
			"/pay/%s/frame/confirm";
	private static final String PAY_IN_FRAME_COMMENT = BASE_PATH +
			"/pay/%s/frame/comment";
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

	private static String roundTokenAmount(double amount) {
		val scale = amount < 1.0 ? 5 : 1;
		val amountInDecimals = BigDecimal.valueOf(amount);
		val roundedAmount = amountInDecimals.setScale(scale, RoundingMode.HALF_UP).toString();
		log.debug("roundTokenAmount: before {} after {} with scale {}", amountInDecimals, roundedAmount, scale);
		return roundedAmount;
	}

	@PostMapping("/{identity}")
	public ResponseEntity<String> payProfileOptions(@PathVariable String identity,
			@RequestBody FrameMessage frameMessage) {
		log.debug("Received pay profile {} options frame message request: {}",
				identity, frameMessage);
		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val paymentProfile = userService.findByUsernameOrIdentity(identity);
		if (paymentProfile != null) {
			val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
					"/payment.png?step=start",
					paymentProfile.getIdentity()));
			val paymentLink = dAppServiceUrl.concat(String.format("/%s?pay",
					paymentProfile.getUsername()));
			return FrameResponse.builder()
					.imageUrl(profileImage)
					.button(new FrameButton("\uD83D\uDDBC\uFE0F via Frame",
							FrameButton.ActionType.POST,
							apiServiceUrl.concat(String.format(PAY_IN_FRAME, paymentProfile.getIdentity()))))
					.button(new FrameButton("\uD83D\uDCF1 via App", FrameButton.ActionType.LINK,
							paymentLink))
					.build().toHtmlResponse();
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/{identity}/frame")
	public ResponseEntity<String> payProfileInFrame(@PathVariable String identity,
			@RequestBody FrameMessage frameMessage) {
		log.debug("Received pay profile {} in frame message request: {}",
				identity, frameMessage);
		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val paymentProfile = userService.findByUsernameOrIdentity(identity);
		if (paymentProfile != null) {
			val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
					"/payment.png?step=token&chainId=%s",
					paymentProfile.getIdentity(), BASE_CHAIN_ID));

			val flowWalletAddress = paymentProfile.getDefaultFlow().getWallets().stream()
					.map(Wallet::getAddress).findFirst().orElse(null);

			if (StringUtils.isBlank(flowWalletAddress)) {
				log.error("Profile doesn't support payments on chainId: {}", DEFAULT_FRAME_PAYMENTS_CHAIN_ID);
				return DEFAULT_HTML_RESPONSE;
			}

			val state = gson.toJson(new FramePaymentMessage(flowWalletAddress, DEFAULT_FRAME_PAYMENTS_CHAIN_ID, null,
					null, null));

			return FrameResponse.builder()
					.imageUrl(profileImage)
					.postUrl(apiServiceUrl.concat(String.format(PAY_IN_FRAME_TOKEN,
							paymentProfile.getIdentity())))
					.button(new FrameButton("ETH", FrameButton.ActionType.POST, null))
					.button(new FrameButton("USDC", FrameButton.ActionType.POST, null))
					.button(new FrameButton("DEGEN", FrameButton.ActionType.POST, null))
					.state(Base64.getEncoder().encodeToString(state.getBytes()))
					.build().toHtmlResponse();
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/{identity}/frame/token")
	public ResponseEntity<String> choosePaymentToken(@PathVariable String identity,
			@RequestBody FrameMessage frameMessage) {
		log.debug("Received choose payment token message request: {}", frameMessage);
		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val buttonIndex = validateMessage.action().tappedButton().index();
		var state = gson.fromJson(
				new String(Base64.getDecoder().decode(validateMessage.action().state().serialized())),
				FramePaymentMessage.class);

		val paymentProfile = userService.findByUsernameOrIdentity(identity);
		if (paymentProfile != null && state != null) {
			val token = switch (buttonIndex) {
				case 1 -> ETH_TOKEN;
				case 2 -> USDC_TOKEN;
				case 3 -> DEGEN_TOKEN;
				default -> null;
			};

			if (token != null) {
				val updatedState = gson.toJson(new FramePaymentMessage(state.address(),
						state.chainId(), token, null, null));
				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
						"/payment.png?step=amount&chainId=%s&token=%s",
						paymentProfile.getIdentity(), BASE_CHAIN_ID, token));
				return FrameResponse.builder()
						.textInput("Enter amount, $ (1-10)")
						.postUrl(apiServiceUrl.concat(String.format(PAY_IN_FRAME_AMOUNT,
								paymentProfile.getIdentity())))
						.button(new FrameButton("$1", FrameButton.ActionType.POST, null))
						.button(new FrameButton("$3", FrameButton.ActionType.POST, null))
						.button(new FrameButton("$5", FrameButton.ActionType.POST, null))
						.button(new FrameButton("Next", FrameButton.ActionType.POST, null))
						.imageUrl(profileImage)
						.state(Base64.getEncoder().encodeToString(updatedState.getBytes()))
						.build().toHtmlResponse();
			}
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/{identity}/frame/amount")
	public ResponseEntity<String> paymentAmount(@PathVariable String identity,
			@RequestBody FrameMessage frameMessage) {
		log.debug("Received enter payment amount message request: {}", frameMessage);
		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val clickedFid = validateMessage.action().interactor().fid();
		val casterFid = validateMessage.action().cast().fid();
		val buttonIndex = validateMessage.action().tappedButton().index();

		val addresses = frameService.getFidAddresses(clickedFid);
		val profiles = frameService.getFidProfiles(addresses);

		var state = gson.fromJson(
				new String(Base64.getDecoder().decode(validateMessage.action().state().serialized())),
				FramePaymentMessage.class);
		val paymentProfile = userService.findByUsernameOrIdentity(identity);
		if (paymentProfile != null && state != null) {
			log.debug("Previous payment state: {}", state);

			var usdAmount = switch (buttonIndex) {
				case 1 -> 1.0;
				case 2 -> 3.0;
				case 3 -> 5.0;
				case 4 -> {
					val input = validateMessage.action().input();
					if (input == null) {
						yield null;
					}
					try {
						val parsedAmount = Double.parseDouble(input.text());
						if (parsedAmount > 0 && parsedAmount <= 10.0) {
							yield parsedAmount;
						} else {
							log.error("Parsed input token amount {} is not within the valid range" +
									" (1-10)", parsedAmount);
							yield null;
						}
					} catch (NumberFormatException ignored) {
						log.error("Failed to parse input token amount.");
						yield null;
					}
				}
				default -> null;
			};

			// fallback to previous state
			if (usdAmount == null && state.usdAmount() != null) {
				usdAmount = state.usdAmount();
			}

			if (usdAmount != null && buttonIndex == 4) {
				// maybe would make sense to reference top cast instead (if it's a bot cast)
				val casterFcName = frameService.getFidFname(casterFid);
				val tokenAmount = roundTokenAmount(
						usdAmount / transactionService.getPrice(state.token()));

				val payment = new Payment(Payment.PaymentType.FRAME, paymentProfile,
						state.chainId(), state.token());

				payment.setUsdAmount(usdAmount.toString());
				payment.setSourceApp(validateMessage.action().signer().client().displayName());
				payment.setSourceRef(String.format("https://warpcast.com/%s/%s",
						casterFcName, validateMessage.action().cast().hash().substring(0, 10)));

				paymentRepository.save(payment);

				val refId = payment.getReferenceId();
				val updatedState = gson.toJson(new FramePaymentMessage(state.address(),
						state.chainId(), state.token(), usdAmount, refId));
				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
						"/payment.png?step=confirm&chainId=%s&token=%s&usdAmount=%s&amount=%s",
						paymentProfile.getIdentity(), state.chainId(), state.token(), usdAmount, tokenAmount));
				val frameResponseBuilder = FrameResponse.builder()
						.postUrl(apiServiceUrl.concat(String.format(PAY_IN_FRAME_CONFIRM,
								paymentProfile.getIdentity())))
						.button(new FrameButton("Pay now", FrameButton.ActionType.TX,
								apiServiceUrl
										.concat(String.format(PAY_IN_FRAME_CONFIRM, paymentProfile.getIdentity()))))
						.imageUrl(profileImage)
						.state(Base64.getEncoder().encodeToString(updatedState.getBytes()));

				// for now just check if profile exists
				if (!profiles.isEmpty()) {
					frameResponseBuilder.button(new FrameButton("Pay later \uD83D\uDD51",
							FrameButton.ActionType.POST,
							apiServiceUrl.concat(String.format(PAY_IN_FRAME_CONFIRM, paymentProfile.getIdentity()))));
				}

				return frameResponseBuilder.build().toHtmlResponse();
			} else {
				val updatedState = gson.toJson(new FramePaymentMessage(state.address(),
						state.chainId(), state.token(), usdAmount, null));

				val tokenAmount = usdAmount != null ? roundTokenAmount(
						usdAmount / transactionService.getPrice(state.token())) : "";

				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
						"/payment.png?step=amount&chainId=%s&token=%s&usdAmount=%s&amount=%s",
						paymentProfile.getIdentity(), state.chainId(), state.token(),
						usdAmount != null ? usdAmount : "", tokenAmount));
				return FrameResponse.builder()
						.textInput(String.format("Enter amount%s, $ (1-10)", usdAmount == null ? " again" : ""))
						.postUrl(apiServiceUrl.concat(String.format(PAY_IN_FRAME_AMOUNT,
								paymentProfile.getIdentity())))
						.button(new FrameButton("$1", FrameButton.ActionType.POST, null))
						.button(new FrameButton("$3", FrameButton.ActionType.POST, null))
						.button(new FrameButton("$5", FrameButton.ActionType.POST, null))
						.button(new FrameButton("Next", FrameButton.ActionType.POST, null))
						.imageUrl(profileImage)
						.state(Base64.getEncoder().encodeToString(updatedState.getBytes()))
						.build().toHtmlResponse();
			}
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/{identity}/frame/confirm")
	public ResponseEntity<String> paymentConfirm(@PathVariable String identity,
			@RequestBody FrameMessage frameMessage) {
		log.debug("Received payment confirm message request: {}", frameMessage);
		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val clickedFid = validateMessage.action().interactor().fid();
		val buttonIndex = validateMessage.action().tappedButton().index();
		val transactionId = validateMessage.action().transaction() != null
				? validateMessage.action().transaction().hash()
				: null;

		val addresses = frameService.getFidAddresses(clickedFid);
		val profiles = frameService.getFidProfiles(addresses);

		val paymentProfile = userService.findByUsernameOrIdentity(identity);
		var state = gson.fromJson(
				new String(Base64.getDecoder().decode(validateMessage.action().state().serialized())),
				FramePaymentMessage.class);

		if (paymentProfile != null && state != null) {
			log.debug("Previous payment state: {}", state);
			if (isFramePaymentMessageComplete(state)) {
				val flowWalletAddress = paymentProfile.getDefaultFlow().getWallets().stream()
						.filter(wallet -> wallet.getNetwork() == state.chainId())
						.map(Wallet::getAddress).findFirst().orElse(null);

				if (!state.address().equals(flowWalletAddress)) {
					log.error("Transaction address doesn't match profile's flow wallet address: " +
							"{} vs {}", state.address(), flowWalletAddress);
					return DEFAULT_HTML_RESPONSE;
				}

				val refId = state.refId();
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
							state.usdAmount() / transactionService.getPrice(state.token()));
					val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
							"/payment.png?step=execute&chainId=%s&token=%s&usdAmount=%s" +
							"&amount=%s&status=%s",
							paymentProfile.getIdentity(), state.chainId(), state.token(),
							state.usdAmount(), tokenAmount, "success"));
					return FrameResponse.builder()
							.imageUrl(profileImage)
							.textInput("Enter your comment")
							.button(new FrameButton("\uD83D\uDCAC Add comment",
									FrameButton.ActionType.POST,
									apiServiceUrl.concat(String.format(PAY_IN_FRAME_COMMENT,
											paymentProfile.getIdentity()))))
							.button(new FrameButton("\uD83D\uDD0E Check tx details",
									FrameButton.ActionType.LINK,
									"https://basescan.org/tx/" + transactionId))
							.state(validateMessage.action().state().serialized())
							.build().toHtmlResponse();
				} else if (buttonIndex == 1) {
					log.debug("Handling payment through frame tx: {}", state);
					val callData = transactionService.generateTxCallData(state);
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
							state.usdAmount() / transactionService.getPrice(state.token()));
					val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
							"/payment.png?step=execute&chainId=%s&token=%s&usdAmount=%s" +
							"&amount=%s",
							paymentProfile.getIdentity(), state.chainId(), state.token(),
							state.usdAmount(), tokenAmount));
					return FrameResponse.builder()
							.imageUrl(profileImage)
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

	@PostMapping("/{identity}/frame/comment")
	public ResponseEntity<String> paymentComment(@PathVariable String identity,
			@RequestBody FrameMessage frameMessage) {
		log.debug("Received payment comment message request: {}", frameMessage);
		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val buttonIndex = validateMessage.action().tappedButton().index();
		val paymentProfile = userService.findByUsernameOrIdentity(identity);
		var state = gson.fromJson(
				new String(Base64.getDecoder().decode(validateMessage.action().state().serialized())),
				FramePaymentMessage.class);

		if (paymentProfile != null && state != null) {
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
					val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
							"/payment.png?step=execute&chainId=%s&token=%s&usdAmount=%s" +
							"&amount=%s&status=%s",
							paymentProfile.getIdentity(), state.chainId(), state.token(),
							state.usdAmount(), tokenAmount, "success"));

					val frameResponseBuilder = FrameResponse.builder()
							.imageUrl(profileImage)
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
										apiServiceUrl.concat(String.format(PAY_IN_FRAME_COMMENT,
												paymentProfile.getIdentity()))));
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
