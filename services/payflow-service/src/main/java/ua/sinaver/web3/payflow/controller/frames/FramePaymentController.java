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
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.FarcasterMessagingService;
import ua.sinaver.web3.payflow.service.TokenPriceService;
import ua.sinaver.web3.payflow.service.TokenService;
import ua.sinaver.web3.payflow.service.TransactionService;
import ua.sinaver.web3.payflow.service.api.IFarcasterHubService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.service.api.IUserService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

import static ua.sinaver.web3.payflow.controller.frames.FramesController.BASE_PATH;
import static ua.sinaver.web3.payflow.controller.frames.FramesController.DEFAULT_HTML_RESPONSE;

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


	private static final String ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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
	private IIdentityService identityService;

	@Autowired
	private TransactionService transactionService;

	@Autowired
	private TokenPriceService tokenPriceService;

	@Autowired
	private PaymentRepository paymentRepository;

	@Autowired
	private FarcasterMessagingService farcasterMessagingService;

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

		val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
				"/payment.png?step=token&chainId=%s", identity, TokenService.BASE_CHAIN_ID));

		val paymentProfile = userService.findByUsernameOrIdentity(identity);

		String paymentAddress = null;
		if (paymentProfile != null && paymentProfile.getDefaultFlow() != null) {
			paymentAddress = paymentProfile.getDefaultFlow().getWallets().stream()
					.map(Wallet::getAddress).findFirst().orElse(null);
		}

		if (StringUtils.isBlank(paymentAddress)) {
			paymentAddress = identity;
		}

		val state = gson.toJson(new FramePaymentMessage(paymentAddress, TokenService.DEFAULT_FRAME_PAYMENTS_CHAIN_ID, null,
				null, null, null));

		return FrameResponse.builder()
				.imageUrl(profileImage)
				.textInput("Enter amount, $ (1-20)")
				.postUrl(apiServiceUrl.concat(String.format(PAY_IN_FRAME_AMOUNT, identity)))
				.button(new FrameButton("ETH", FrameButton.ActionType.POST, null))
				.button(new FrameButton("USDC", FrameButton.ActionType.POST, null))
				.button(new FrameButton("DEGEN", FrameButton.ActionType.POST, null))
				.state(Base64.getEncoder().encodeToString(state.getBytes()))
				.build().toHtmlResponse();
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

		val senderFid = validateMessage.action().interactor().fid();
		val receiverFid = validateMessage.action().cast().fid();
		val buttonIndex = validateMessage.action().tappedButton().index();
		val inputText = validateMessage.action().input() != null ?
				validateMessage.action().input().text() : null;

		val profiles = identityService.getFidProfiles(senderFid);

		val sourceApp = validateMessage.action().signer().client().displayName();
		val sourceHash = validateMessage.action().cast().hash();

		val state = validateMessage.action().state().serialized();
		var paymentState = gson.fromJson(
				new String(Base64.getDecoder().decode(state)),
				FramePaymentMessage.class);

		if (paymentState != null) {
			log.debug("Previous payment state: {}", paymentState);

			Double usdAmount = null;
			if (StringUtils.isNotBlank(inputText)) {
				try {
					val parsedAmount = Double.parseDouble(inputText);
					if (parsedAmount > 0 && parsedAmount <= 20.0) {
						usdAmount = parsedAmount;
					} else {
						log.error("Parsed input token amount {} is not within the valid range" +
								" (1-20)", parsedAmount);
					}
				} catch (NumberFormatException ignored) {
					log.error("Failed to parse input token amount.");
				}
			}

			if (usdAmount != null) {
				val paymentProfile = userService.findByUsernameOrIdentity(identity);

				String paymentAddress = null;
				if (paymentProfile != null && paymentProfile.getDefaultFlow() != null) {
					paymentAddress = paymentProfile.getDefaultFlow().getWallets().stream()
							.map(Wallet::getAddress).findFirst().orElse(null);
				}

				if (StringUtils.isBlank(paymentAddress)) {
					paymentAddress = identity;
				}

				val token = switch (buttonIndex) {
					case 1 -> TokenService.ETH_TOKEN;
					case 2 -> TokenService.USDC_TOKEN;
					case 3 -> TokenService.DEGEN_TOKEN;
					default -> null;
				};

				if (token != null) {
					val tokenAmount =
							usdAmount / tokenPriceService.getPrices().get(token);

					val payment = new Payment(Payment.PaymentType.FRAME, paymentProfile,
							paymentState.chainId(), token);

					payment.setUsdAmount(usdAmount.toString());
					payment.setSourceApp(sourceApp);

					// handle frame in direct cast messaging
					if (StringUtils.isNotBlank(sourceHash) && !sourceHash.equals(ZERO_ADDRESS)) {
						val casterFcName = identityService.getFidFname(receiverFid);
						val sourceRef = String.format("https://warpcast.com/%s/%s",
								casterFcName, sourceHash.substring(0,
										10));
						payment.setSourceHash(sourceHash);
						payment.setSourceRef(sourceRef);
					}

					if (paymentProfile == null) {
						payment.setReceiverAddress(paymentAddress);
					}

					paymentRepository.save(payment);

					val refId = payment.getReferenceId();
					val updatedState = gson.toJson(new FramePaymentMessage(paymentState.address(),
							paymentState.chainId(), token, usdAmount, tokenAmount, refId));
					val profileImage = framesServiceUrl.concat(String.format(
							"/images/profile/%s/payment.png?step=confirm&chainId=%s&token=%s&usdAmount=%s&tokenAmount=%s",
							identity, paymentState.chainId(), token, usdAmount,
							roundTokenAmount(tokenAmount)));
					val frameResponseBuilder = FrameResponse.builder()
							.postUrl(apiServiceUrl.concat(String.format(PAY_IN_FRAME_CONFIRM, refId)))
							.button(new FrameButton("\uD83D\uDC9C Pay", FrameButton.ActionType.TX,
									apiServiceUrl.concat(String.format(PAY_IN_FRAME_CONFIRM, refId))))
							.imageUrl(profileImage)
							.state(Base64.getEncoder().encodeToString(updatedState.getBytes()));

					// for now just check if profile exists
					if (!profiles.isEmpty()) {
						frameResponseBuilder.button(new FrameButton("\uD83D\uDCF1 Intent",
								FrameButton.ActionType.POST,
								apiServiceUrl.concat(String.format(PAY_IN_FRAME_CONFIRM, refId))));
					}

					return frameResponseBuilder.build().toHtmlResponse();
				}
			} else {
				log.warn("Amount wasn't entered, responding with frame to enter again");
				val jarImage = framesServiceUrl.concat(String.format("/images/profile/%s/payment.png" +
						"?step=amount&chainId=%s", identity, TokenService.BASE_CHAIN_ID));
				return FrameResponse.builder()
						.textInput("Enter amount again, $ (1-20)")
						.imageUrl(jarImage)
						.postUrl(apiServiceUrl.concat(String.format(PAY_IN_FRAME_AMOUNT, identity)))
						//.button(new FrameButton("ETH", FrameButton.ActionType.POST, null))
						.button(new FrameButton("USDC", FrameButton.ActionType.POST, null))
						.button(new FrameButton("DEGEN", FrameButton.ActionType.POST, null))
						.state(state)
						.build().toHtmlResponse();
			}
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/{refId}/frame/confirm")
	public ResponseEntity<?> paymentConfirm(@PathVariable String refId,
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

		val profiles = identityService.getFidProfiles(clickedFid);

		val payment = paymentRepository.findByReferenceId(refId);
		if (payment == null) {
			log.error("Payment was not found for refId {}", refId);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Payment not found!"));
		} else if (!payment.getStatus().equals(Payment.PaymentStatus.PENDING)) {
			log.warn("Payment was completed already {} - {}", refId, payment);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Payment was completed already!"));
		}

		val paymentIdentity = payment.getReceiver() != null ?
				payment.getReceiver().getIdentity() : payment.getReceiverAddress();
		val tokenAmount = StringUtils.isNotBlank(payment.getTokenAmount()) ?
				Double.parseDouble(payment.getTokenAmount()) :
				Double.parseDouble(payment.getUsdAmount()) / tokenPriceService.getPrices().get(payment.getToken());
		if (paymentIdentity != null) {
			// handle transaction execution result
			if (!StringUtils.isBlank(transactionId)) {
				log.debug("Handling tx id {} for {}", transactionId, payment);
				// TODO: check tx execution status
				payment.setHash(transactionId);
				payment.setStatus(Payment.PaymentStatus.COMPLETED);
				payment.setCompletedDate(new Date());

				log.debug("Updated payment for ref: {} - {}", refId, payment);
				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
								"/payment.png?step=execute&chainId=%s&token=%s&usdAmount=%s" +
								"&tokenAmount=%s&status=%s",
						paymentIdentity, payment.getNetwork(), payment.getToken(),
						StringUtils.isNotBlank(payment.getUsdAmount()) ? payment.getUsdAmount() :
								"", roundTokenAmount(tokenAmount), "success"));
				return FrameResponse.builder()
						.imageUrl(profileImage)
						.textInput("Enter your comment")
						.button(new FrameButton("\uD83D\uDCAC Add comment",
								FrameButton.ActionType.POST,
								apiServiceUrl.concat(String.format(PAY_IN_FRAME_COMMENT,
										payment.getReferenceId()))))
						.button(new FrameButton("\uD83D\uDD0E Receipt",
								FrameButton.ActionType.LINK,
								String.format("https://onceupon.gg/%s", payment.getHash())))
						.build().toHtmlResponse();
			} else if (buttonIndex == 1) {
				log.debug("Handling payment through frame tx: {}", payment);
				val callData = transactionService.generateTxCallData(payment);
				log.debug("Returning callData for tx payment: {} - {}", callData, payment);
				return ResponseEntity.ok()
						.contentType(MediaType.APPLICATION_JSON)
						.body(callData);

			} else if (buttonIndex == 2) {
				log.debug("Submitting payment for later in app execution: {}", payment);
				// TODO: for now set the first
				payment.setSender(profiles.getFirst());
				payment.setType(Payment.PaymentType.INTENT);

				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
								"/payment.png?step=execute&chainId=%s&token=%s&usdAmount=%s" +
								"&tokenAmount=%s",
						paymentIdentity, payment.getNetwork(), payment.getToken(),
						StringUtils.isNotBlank(payment.getUsdAmount()) ? payment.getUsdAmount() :
								"", roundTokenAmount(tokenAmount)));
				return FrameResponse.builder()
						.imageUrl(profileImage)
						.button(new FrameButton("\uD83D\uDCF1 Payflow",
								FrameButton.ActionType.LINK, dAppServiceUrl))
						.build().toHtmlResponse();
			}
		} else {
			log.error("Frame payment message is not complete or valid: {}", payment);
		}

		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/{refId}/frame/comment")
	public ResponseEntity<?> paymentComment(@PathVariable String refId,
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
		val senderFid = validateMessage.action().interactor().fid();

		val payment = paymentRepository.findByReferenceId(refId);
		if (payment == null) {
			log.error("Payment was not found for refId {}", refId);
			return DEFAULT_HTML_RESPONSE;
		} else if (!payment.getStatus().equals(Payment.PaymentStatus.COMPLETED)) {
			log.error("Payment is not in complete state {} - {}", refId, payment);
			return DEFAULT_HTML_RESPONSE;
		} else if (!StringUtils.isBlank(payment.getComment())) {
			log.error("Payment comment was added already {} - {}", refId, payment);
			return DEFAULT_HTML_RESPONSE;
		}

		val paymentIdentity = payment.getReceiver() != null ?
				payment.getReceiver().getIdentity() : payment.getReceiverAddress();
		val tokenAmount = roundTokenAmount(
				payment.getTokenAmount() != null ?
						Double.parseDouble(payment.getTokenAmount()) :
						Double.parseDouble(
								payment.getUsdAmount()) / tokenPriceService.getPrices().get(payment.getToken()
						)
		);
		if (paymentIdentity != null) {
			if (buttonIndex == 1) {
				log.debug("Handling add comment for payment: {}", payment);
				// TODO: optimize

				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
								"/payment.png?step=execute&chainId=%s&token=%s&usdAmount=%s" +
								"&tokenAmount=%s&status=%s",
						paymentIdentity, payment.getNetwork(), payment.getToken(),
						StringUtils.isNotBlank(payment.getUsdAmount()) ? payment.getUsdAmount() :
								"", tokenAmount, "success"));

				val frameResponseBuilder = FrameResponse.builder()
						.imageUrl(profileImage)
						.button(new FrameButton("\uD83D\uDD0E Receipt",
								FrameButton.ActionType.LINK,
								String.format("https://onceupon.gg/%s", payment.getHash())))
						.state(validateMessage.action().state().serialized());

				val input = validateMessage.action().input();

				val comment = input != null ? input.text() : null;
				if (!StringUtils.isBlank(comment)) {
					payment.setComment(comment);

					// send direct message with comment
					try {

						// fetch by identity, hence it will work for both dcs and feed frames
						val receiverFid = identityService.getIdentityFid(paymentIdentity);
						val receiverFname = identityService.getIdentityFname(paymentIdentity);
						val senderFname = identityService.getFidFname(senderFid);

						val messageText = String.format("""
										 @%s, you've been paid %s %s by @%s 🎉
										💬 Comment: %s   
																				
										%s								
										🧾 Receipt: %s

										p.s. join /payflow channel for updates 👀""",
								receiverFname,
								StringUtils.isNotBlank(payment.getTokenAmount()) ?
										payment.getTokenAmount() :
										String.format("$%s", payment.getUsdAmount()),
								payment.getToken().toUpperCase(),
								senderFname,
								payment.getComment(),
								payment.getSourceRef() != null ? String.format("🔗 Source: %s",
										payment.getSourceRef()) : "",
								String.format("https://onceupon.gg/%s", payment.getHash()));
						val response = farcasterMessagingService.message(
								new DirectCastMessage(String.valueOf(receiverFid), messageText,
										UUID.randomUUID()));

						if (!response.result().success()) {
							log.error("Failed to send direct cast with {} for frame payment  " +
									"completion", messageText);
						}
					} catch (Throwable t) {
						log.error("Failed to send direct cast with exception: ", t);
					}
				} else {
					frameResponseBuilder.textInput("Enter your comment again")
							.button(new FrameButton("\uD83D\uDCAC Add comment",
									FrameButton.ActionType.POST,
									apiServiceUrl.concat(String.format(PAY_IN_FRAME_COMMENT,
											payment.getReferenceId()))));
				}
				return frameResponseBuilder.build().toHtmlResponse();
			}
		} else {
			log.debug("Frame payment message is not complete or valid: {}", payment);
		}

		return DEFAULT_HTML_RESPONSE;
	}
}
