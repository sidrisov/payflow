package ua.sinaver.web3.payflow.controller.frames;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.message.FrameButton;
import ua.sinaver.web3.payflow.message.FramePaymentMessage;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.message.Token;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.*;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.service.api.IUserService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Comparator;
import java.util.Date;
import java.util.UUID;
import java.util.regex.Pattern;

import static ua.sinaver.web3.payflow.controller.frames.FramesController.BASE_PATH;
import static ua.sinaver.web3.payflow.controller.frames.FramesController.DEFAULT_HTML_RESPONSE;

@RestController
@RequestMapping("/farcaster/frames/pay")
@Transactional
@Slf4j
public class FramePaymentController {

	public static final String PAY = BASE_PATH +
			"/pay/%s";
	public static final String PAY_CREATE = BASE_PATH +
			"/pay/create";
	private static final String PAY_SHARE = BASE_PATH +
			"/pay/%s/share";
	private static final String PAY_IN_FRAME = BASE_PATH +
			"/pay/%s/frame";
	private static final String PAY_IN_FRAME_COMMAND = BASE_PATH +
			"/pay/%s/frame/command";
	private static final String PAY_IN_FRAME_CONFIRM = BASE_PATH +
			"/pay/%s/frame/confirm";
	private static final String PAY_IN_FRAME_COMMENT = BASE_PATH +
			"/pay/%s/frame/comment";

	private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();

	@Autowired
	private IFarcasterNeynarService neynarService;
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

	@Autowired
	private PaymentService paymentService;

	@Autowired
	private NotificationService notificationService;

	private static String roundTokenAmount(double amount) {
		val scale = amount < 1.0 ? 5 : 1;
		val amountInDecimals = BigDecimal.valueOf(amount);
		val roundedAmount = amountInDecimals.setScale(scale, RoundingMode.HALF_UP).toString();
		log.debug("roundTokenAmount: before {} after {} with scale {}", amountInDecimals, roundedAmount, scale);
		return roundedAmount;
	}

	@PostMapping("/create")
	public ResponseEntity<?> create(@RequestBody FrameMessage frameMessage) {
		log.debug("Received create payment frame message request: {}", frameMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val castInteractor = validateMessage.action().interactor();

		// pay first with higher social score now invite first
		val paymentAddresses = identityService.getIdentitiesInfo(castInteractor.addressesWithoutCustodialIfAvailable())
				.stream().max(Comparator.comparingInt(IdentityMessage::score))
				.map(IdentityMessage::address).stream().toList();

		// check if profile exist
		val paymentProfile = identityService.getProfiles(paymentAddresses).stream().findFirst().orElse(null);
		if (paymentProfile == null) {
			log.warn("Interactor fid {} is not on Payflow", castInteractor);
		}

		String paymentIdentity;
		if (paymentProfile == null || (paymentProfile.getDefaultFlow() == null
				&& paymentProfile.getDefaultReceivingAddress() == null)) {
			if (!paymentAddresses.isEmpty()) {
				// return first associated address
				paymentIdentity = paymentAddresses.getFirst();
			} else {
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("Recipient address not found!"));
			}
		} else {
			// return profile identity
			paymentIdentity = paymentProfile.getIdentity();
		}

		val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
				"/payment.png?step=create", paymentIdentity));

		return FrameResponse.builder()
				.imageUrl(profileImage)
				.textInput("Enter payment frame title")
				.button(new FrameButton("\uD83D\uDCDD Cast", FrameButton.ActionType.POST_REDIRECT,
						apiServiceUrl.concat(String.format(PAY_SHARE, paymentIdentity))))
				.build().toHtmlResponse();
	}

	@PostMapping("/{identity}/share")
	public ResponseEntity<?> share(@PathVariable String identity,
	                               @RequestBody FrameMessage frameMessage) {
		log.debug("Received share payment frame message request: {}", frameMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val entryTitle = validateMessage.action().input() != null ?
				Base64.getUrlEncoder().withoutPadding().encodeToString(
						validateMessage.action().input().text().getBytes(StandardCharsets.UTF_8)
				) : "";

		try {
			val baseUrl = "https://warpcast.com/~/compose";
			val castText = URLEncoder.encode("Hey hey you can pay me here", StandardCharsets.UTF_8);
			val embedUrl = String.format("https://frames.payflow" +
					".me/%s?entryTitle=%s", identity, entryTitle);

			val castShareDeepLink = String.format("%s?text=%s&embeds[]=%s", baseUrl, castText,
					embedUrl);

			val redirectURI = new URI(castShareDeepLink);
			log.debug("Redirecting to {}", redirectURI);
			return ResponseEntity.status(HttpStatus.FOUND).location(redirectURI).build();
		} catch (Throwable t) {
			log.debug("Failed to redirect:", t);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Failed to redirect!"));
		}
	}

	@PostMapping("/{identity}")
	public ResponseEntity<String> paymentOptions(@PathVariable String identity,
	                                             @RequestBody FrameMessage frameMessage) {
		log.debug("Received pay profile {} options frame message request: {}",
				identity, frameMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
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
			val installCastActionLink = String.format(
					"https://warpcast.com/~/add-cast-action?url=%s/api/farcaster/actions/profile",
					apiServiceUrl);

			return FrameResponse.builder()
					.imageUrl(profileImage)
					.button(new FrameButton("⚡\uFE0F Pay",
							FrameButton.ActionType.POST,
							apiServiceUrl.concat(String.format(PAY_IN_FRAME, paymentProfile.getIdentity()))))
					.button(new FrameButton("\uD83D\uDCF1 App", FrameButton.ActionType.LINK,
							paymentLink))
					.button(new FrameButton("➕ Action", FrameButton.ActionType.LINK,
							installCastActionLink))
					.button(new FrameButton("\uD83E\uDE84 Create", FrameButton.ActionType.POST,
							apiServiceUrl.concat(PAY_CREATE)))
					.build().toHtmlResponse();
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/{identity}/frame")
	public ResponseEntity<String> pay(@PathVariable String identity,
	                                  @RequestBody FrameMessage frameMessage) {
		log.debug("Received pay profile {} in frame message request: {}",
				identity, frameMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
				"/payment.png?step=command", identity));

		val tokensSupported = "https://payflowlabs.notion" +
				".site/Payflow-support-tokens-chains-e36f2c1e9f7e4bfd834baf604ce9a375";
		return FrameResponse.builder()
				.imageUrl(profileImage)
				.textInput("e.g.: $1 degen | 1 usdc optimism")
				.postUrl(apiServiceUrl.concat(String.format(PAY_IN_FRAME_COMMAND, identity)))
				.button(new FrameButton("Confirm", FrameButton.ActionType.POST, null))
				.button(new FrameButton("Tokens", FrameButton.ActionType.LINK, tokensSupported))
				.build().toHtmlResponse();
	}

	@PostMapping("/{identity}/frame/command")
	public ResponseEntity<?> command(@PathVariable String identity,
	                                 @RequestBody FrameMessage frameMessage) {
		log.debug("Received enter payment amount message request: {}", frameMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val senderFarcasterUser = validateMessage.action().interactor();
		val inputText = validateMessage.action().input() != null ?
				validateMessage.action().input().text().toLowerCase() : null;

		if (StringUtils.isBlank(inputText)) {
			log.warn("Nothing entered for payment amount by {}", senderFarcasterUser);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Nothing entered, try again!"));
		}

		val receiverFarcasterUser = validateMessage.action().cast().author() != null ?
				validateMessage.action().cast().author() :
				neynarService.fetchFarcasterUser(validateMessage.action().cast().fid());

		val profiles = identityService.getProfiles(senderFarcasterUser.addresses());

		val sourceApp = validateMessage.action().signer().client().displayName();
		val sourceHash = validateMessage.action().cast().hash();

		val paymentPattern = "\\s*(?<amount>\\$?[0-9]+(?:\\.[0-9]+)?[km]?)?\\s*(?<rest>.*)";
		val matcher = Pattern.compile(paymentPattern, Pattern.CASE_INSENSITIVE).matcher(inputText);

		if (!matcher.find()) {
			log.warn("Enter command not recognized: {} by fid: {}", inputText, senderFarcasterUser);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Enter command not recognized!"));
		}

		val amountStr = matcher.group("amount");

		Double usdAmount = null;
		Double tokenAmount = null;
		if (amountStr.startsWith("$")) {
			usdAmount = Double.parseDouble(amountStr.replace("$", ""));
			if (usdAmount == 0) {
				val zeroUsdAmountError = "$ amount shouldn't be ZERO!";
				log.warn(zeroUsdAmountError);
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage(zeroUsdAmountError));
			}
		} else {
			tokenAmount = paymentService.parseTokenAmount(amountStr);
			if (tokenAmount == 0) {
				val zeroTokenAmountError = "Token amount shouldn't be ZERO!";
				log.warn(zeroTokenAmountError);
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage(zeroTokenAmountError));
			}
		}

		val restText = matcher.group("rest");

		Token token;
		val tokens = paymentService.parseCommandTokens(restText);
		if (tokens.size() == 1) {
			token = tokens.getFirst();
		} else {
			val chain = paymentService.parseCommandChain(restText);
			token = tokens.stream().filter(t -> t.chain().equals(chain)).findFirst().orElse(null);
		}

		if (token == null) {
			val chainNotSupportedError = String.format("Token not supported: %s!", restText);
			log.warn(chainNotSupportedError);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage(chainNotSupportedError));
		}

		String paymentAddress = null;
		val paymentProfile = userService.findByUsernameOrIdentity(identity);

		if (paymentProfile != null) {
			paymentAddress = paymentService.getUserReceiverAddress(paymentProfile, token.chainId());
		}
		if (StringUtils.isBlank(paymentAddress)) {
			// TODO: add a proper fix to support recipients based on ens, fc name, fid
			if (identity.endsWith(".eth") || identity.endsWith(".cb.id")) {
				paymentAddress = identityService.getENSAddress(identity);
			} else {
				paymentAddress = identity;
			}
		}

		log.debug("Receiver: {}, amount: {}, token: {}", paymentAddress, amountStr, token);

		val payment = new Payment(Payment.PaymentType.FRAME, paymentProfile,
				token.chainId(), token.id());
		payment.setSenderAddress(senderFarcasterUser.addressesWithoutCustodialIfAvailable().getFirst());
		payment.setSender(profiles.getFirst());
		payment.setReceiverAddress(paymentAddress);
		if (tokenAmount != null) {
			payment.setTokenAmount(tokenAmount.toString());
		} else {
			payment.setUsdAmount(usdAmount.toString());
		}
		payment.setSourceApp(sourceApp);
		// handle frame in direct cast messaging
		if (StringUtils.isNotBlank(sourceHash) && !sourceHash.equals(TokenService.ZERO_ADDRESS)) {
			val sourceRef = String.format("https://warpcast.com/%s/%s",
					receiverFarcasterUser.username(), sourceHash.substring(0, 10));
			payment.setSourceHash(sourceHash);
			payment.setSourceRef(sourceRef);
		}
		paymentRepository.save(payment);

		val refId = payment.getReferenceId();
		val updatedState = gson.toJson(new FramePaymentMessage(paymentAddress,
				token.chainId(), token.id(), usdAmount, tokenAmount, refId));
		val profileImage = framesServiceUrl.concat(String.format(
				"/images/profile/%s/payment.png?step=confirm&chainId=%s&token=%s&usdAmount=%s&tokenAmount=%s",
				identity, token.chainId(), token.id(), usdAmount != null ? usdAmount : "",
				tokenAmount != null ? tokenAmount : ""));
		val frameResponseBuilder = FrameResponse.builder()
				.postUrl(apiServiceUrl.concat(String.format(PAY_IN_FRAME_CONFIRM, refId)))
				.button(new FrameButton("\uD83D\uDC9C Pay", FrameButton.ActionType.TX,
						apiServiceUrl.concat(String.format(PAY_IN_FRAME_CONFIRM, refId))))
				.imageUrl(profileImage)
				.state(Base64.getEncoder().encodeToString(updatedState.getBytes()));

		// for now just check if profile exists
		if (!profiles.isEmpty()) {
			frameResponseBuilder.button(new FrameButton("\uD83D\uDCF1 App",
					FrameButton.ActionType.LINK, dAppServiceUrl));
		}

		frameResponseBuilder.button(new FrameButton("\uD83D\uDE4B\uD83C\uDFFB FAQ",
				FrameButton.ActionType.LINK,
				"https://payflowlabs.notion.site/FAQs-20593cf7734e4d78ad0dc91c8e8982e5"));

		return frameResponseBuilder.build().toHtmlResponse();
	}

	@PostMapping("/{refId}/frame/confirm")
	public ResponseEntity<?> confirm(@PathVariable String refId,
	                                 @RequestBody FrameMessage frameMessage) {
		log.debug("Received payment confirm message request: {}", frameMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val castInteractor = validateMessage.action().interactor();
		val buttonIndex = validateMessage.action().tappedButton().index();
		val transactionId = validateMessage.action().transaction() != null
				? validateMessage.action().transaction().hash()
				: null;

		val profiles = identityService.getProfiles(castInteractor.addresses());

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

		val paymentIdentity = payment.getReceiver() != null ? payment.getReceiver().getIdentity()
				: payment.getReceiverAddress();
		val tokenAmount = StringUtils.isNotBlank(payment.getTokenAmount())
				? Double.parseDouble(payment.getTokenAmount())
				: Double.parseDouble(payment.getUsdAmount()) / tokenPriceService.getPrices().get(payment.getToken());
		if (paymentIdentity != null) {
			// handle transaction execution result
			if (!StringUtils.isBlank(transactionId)) {
				log.debug("Handling tx id {} for {}", transactionId, payment);
				// TODO: check tx execution status
				payment.setHash(transactionId);
				payment.setStatus(Payment.PaymentStatus.COMPLETED);
				payment.setCompletedDate(new Date());

				log.debug("Updated payment for ref: {} - {}", refId, payment);

				notificationService.paymentReply(payment);

				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
								"/payment.png?step=execute&chainId=%s&token=%s&usdAmount=%s" +
								"&tokenAmount=%s&status=%s",
						paymentIdentity, payment.getNetwork(), payment.getToken(),
						StringUtils.isNotBlank(payment.getUsdAmount()) ? payment.getUsdAmount() : "",
						roundTokenAmount(tokenAmount), "success"));
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

			}
		} else {
			log.error("Frame payment message is not complete or valid: {}", payment);
		}

		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/{refId}/frame/comment")
	public ResponseEntity<?> comment(@PathVariable String refId,
	                                 @RequestBody FrameMessage frameMessage) {
		log.debug("Received payment comment message request: {}", frameMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val buttonIndex = validateMessage.action().tappedButton().index();
		val senderFarcasterUser = validateMessage.action().interactor();

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

		val paymentIdentity = payment.getReceiver() != null ? payment.getReceiver().getIdentity()
				: payment.getReceiverAddress();
		val tokenAmount = roundTokenAmount(
				payment.getTokenAmount() != null ? Double.parseDouble(payment.getTokenAmount())
						: Double.parseDouble(
						payment.getUsdAmount()) / tokenPriceService.getPrices().get(payment.getToken()));
		if (paymentIdentity != null) {
			if (buttonIndex == 1) {
				log.debug("Handling add comment for payment: {}", payment);
				// TODO: optimize

				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
								"/payment.png?step=execute&chainId=%s&token=%s&usdAmount=%s" +
								"&tokenAmount=%s&status=%s",
						paymentIdentity, payment.getNetwork(), payment.getToken(),
						StringUtils.isNotBlank(payment.getUsdAmount()) ? payment.getUsdAmount() : "", tokenAmount,
						"success"));

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
						val senderFname = senderFarcasterUser.username();

						val receiptUrl = String.format("https://onceupon.gg/%s", payment.getHash());
						val messageText = String.format("""
										 @%s, you've been paid %s %s by @%s 🎉
										💬 Comment: %s

										%s
										🧾 Receipt: %s

										Install `⚡ Pay` at app.payflow.me/actions
										p.s. join /payflow channel for updates 👀""",

								receiverFname,
								StringUtils.isNotBlank(payment.getTokenAmount()) ? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
										: String.format("$%s", payment.getUsdAmount()),
								payment.getToken().toUpperCase(),
								senderFname,
								payment.getComment(),
								payment.getSourceRef() != null ? String.format("🔗 Source: %s",
										payment.getSourceRef()) : "",
								receiptUrl);
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
