package ua.sinaver.web3.payflow.controller;

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
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.data.*;
import ua.sinaver.web3.payflow.message.*;
import ua.sinaver.web3.payflow.repository.GiftRepository;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.TransactionService;
import ua.sinaver.web3.payflow.service.api.*;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static ua.sinaver.web3.payflow.service.TransactionService.*;

@RestController
@RequestMapping("/farcaster/frames")
@Transactional
@Slf4j
public class FramesController {
	private static final String BASE_PATH = "/api/farcaster/frames";
	private static final String CONNECT_ACTIONS = BASE_PATH +
			"/actions";
	private static final String CONNECT_IDENTITY_ACTIONS = BASE_PATH +
			"/actions/%s";
	private static final String CONNECT_IDENTITY_ACTIONS_INVITE = BASE_PATH +
			"/actions/%s/invite";
	private static final String CONNECT_IDENTITY_ACTIONS_GIFT = BASE_PATH +
			"/actions/%s/gift";
	private static final String CONNECT_IDENTITY_ACTIONS_GIFT_BACK = BASE_PATH +
			"/actions/%s/gift/back";
	private static final String CONNECT_IDENTITY_ACTIONS_BACK = BASE_PATH +
			"/actions/%s/back";
	private static final String PAY = BASE_PATH +
			"/pay";
	private static final String PAY_IN_FRAME = BASE_PATH +
			"/pay/frame";
	private static final String PAY_IN_FRAME_TOKEN = BASE_PATH +
			"/pay/frame/token";
	private static final String PAY_IN_FRAME_AMOUNT = BASE_PATH +
			"/pay/frame/amount";
	private static final String PAY_IN_FRAME_CONFIRM = BASE_PATH +
			"/pay/frame/confirm";
	private static final String PAY_IN_FRAME_COMMENT = BASE_PATH +
			"/pay/frame/comment";
	private static final ResponseEntity<String> DEFAULT_HTML_RESPONSE =
			FrameResponse.builder().imageUrl("https://i.imgur.com/Vs0loYg.png").build().toHtmlResponse();
	private static final FrameButton BACK_FRAME_BUTTON = backFrameButton(null);
	private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
	@Autowired
	private PaymentRepository paymentRepository;
	@Autowired
	private GiftRepository giftRepository;
	@Value("${payflow.dapp.url}")
	private String dAppServiceUrl;
	@Value("${payflow.api.url}")
	private String apiServiceUrl;
	@Value("${payflow.frames.url}")
	private String framesServiceUrl;
	@Autowired
	private IFarcasterHubService farcasterHubService;
	@Autowired
	private InvitationRepository invitationRepository;
	@Autowired
	private IdentityService identityService;
	@Autowired
	private IFrameService frameService;
	@Autowired
	private IUserService userService;
	@Autowired
	private ISocialGraphService socialGraphService;
	@Autowired
	private IContactBookService contactBookService;

	@Autowired
	private TransactionService transactionService;

	private static FrameButton backFrameButton(String target) {
		return new FrameButton("⬅\uFE0F Back",
				FrameButton.ActionType.POST,
				target);
	}

	private static String roundTokenAmount(double amount) {
		val scale = amount < 1.0 ? 5 : 1;
		val amountInDecimals = BigDecimal.valueOf(amount);
		val roundedAmount = amountInDecimals.setScale(scale, RoundingMode.HALF_UP).toString();
		log.debug("roundTokenAmount: before {} after {} with scale {}", amountInDecimals, roundedAmount, scale);
		return roundedAmount;
	}

	@PostMapping("/connect")
	public ResponseEntity<String> connect(@RequestBody FrameMessage frameMessage) {
		log.debug("Received connect frame message request: {}", frameMessage);
		val validateMessage =
				farcasterHubService.validateFrameMessageWithNeynar(
						frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val clickedFid = validateMessage.action().interactor().fid();
		val casterFid = validateMessage.action().cast().fid();

		// clear cache only on connect
		socialGraphService.cleanCache("fc_fid:".concat(String.valueOf(clickedFid)), null);

		val addresses = frameService.getFidAddresses(clickedFid);
		val profiles = frameService.getFidProfiles(addresses);

		User casterProfile;
		if (clickedFid != casterFid) {
			casterProfile =
					frameService.getFidProfile(casterFid, null);
		} else {
			casterProfile = profiles.stream().findFirst().orElse(null);
		}

		val postUrl = apiServiceUrl.concat(CONNECT_ACTIONS);
		val frameResponseBuilder = FrameResponse.builder().postUrl(postUrl);
		if (!profiles.isEmpty()) {
			log.debug("Found profiles for {}: {}", clickedFid, profiles);
			for (val profile : profiles) {
				frameResponseBuilder.button(new FrameButton(String.format("✅ %s @%s",
						profile.getDisplayName(), profile.getUsername()),
						FrameButton.ActionType.POST, null));
			}
			val image = framesServiceUrl.concat(String.format("/images/profile/%s/welcome.png",
					validateMessage.action().interactor().username()));
			frameResponseBuilder.imageUrl(image);
		} else {
			val invitations = contactBookService.filterByInvited(addresses);
			log.debug("Invitations for addresses {} {}", addresses, invitations);

			if (!invitations.isEmpty()) {
				val image = framesServiceUrl.concat("/images/profile/invited.png");
				val linkUrl = dAppServiceUrl.concat("/connect");
				frameResponseBuilder.imageUrl(image)
						.cacheImage(false)
						.button(new FrameButton("Sign Up", FrameButton.ActionType.LINK, linkUrl));
			} else {
				val image = framesServiceUrl.concat("/images/profile/notinvited.png");
				frameResponseBuilder.imageUrl(image);
			}
		}

		if (casterProfile != null) {
			frameResponseBuilder.button(new FrameButton("Pay", FrameButton.ActionType.POST,
					apiServiceUrl.concat(PAY)));
		}
		return frameResponseBuilder.build().toHtmlResponse();
	}

	@PostMapping("/pay")
	public ResponseEntity<String> payProfileOptions(@RequestBody FrameMessage frameMessage) {
		log.debug("Received pay profile options frame message request: {}", frameMessage);
		val validateMessage =
				farcasterHubService.validateFrameMessageWithNeynar(
						frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val clickedFid = validateMessage.action().interactor().fid();
		val casterFid = validateMessage.action().cast().fid();

		val addresses = frameService.getFidAddresses(clickedFid);
		val profiles = frameService.getFidProfiles(addresses);

		User casterProfile;
		if (clickedFid != casterFid) {
			casterProfile =
					frameService.getFidProfile(casterFid, null);
		} else {
			casterProfile = profiles.stream().findFirst().orElse(null);
		}

		if (casterProfile != null) {
			val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
							"/payment.png?step=start",
					casterProfile.getIdentity()));
			val paymentLink = dAppServiceUrl.concat(String.format("/%s?pay",
					casterProfile.getUsername()));
			return FrameResponse.builder()
					.imageUrl(profileImage)
					.button(new FrameButton("\uD83D\uDDBC\uFE0F via Frame",
							FrameButton.ActionType.POST,
							apiServiceUrl.concat(PAY_IN_FRAME)))
					.button(new FrameButton("\uD83D\uDCF1 via App", FrameButton.ActionType.LINK,
							paymentLink))
					.build().toHtmlResponse();
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/pay/frame")
	public ResponseEntity<String> payProfileInFrame(@RequestBody FrameMessage frameMessage) {
		log.debug("Received pay profile in frame message request: {}", frameMessage);
		val validateMessage =
				farcasterHubService.validateFrameMessageWithNeynar(
						frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val clickedFid = validateMessage.action().interactor().fid();
		val casterFid = validateMessage.action().cast().fid();

		val addresses = frameService.getFidAddresses(clickedFid);
		val profiles = frameService.getFidProfiles(addresses);

		User casterProfile;
		if (clickedFid != casterFid) {
			casterProfile =
					frameService.getFidProfile(casterFid, null);
		} else {
			casterProfile = profiles.stream().findFirst().orElse(null);
		}


		if (casterProfile != null) {
			val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
							"/payment.png?step=token&chainId=%s",
					casterProfile.getIdentity(), BASE_CHAIN_ID));

			val flowWalletAddress = casterProfile.getDefaultFlow().getWallets().stream()
					.map(Wallet::getAddress).findFirst().orElse(null);

			if (StringUtils.isBlank(flowWalletAddress)) {
				log.error("Profile doesn't support payments on chainId: {}", DEFAULT_FRAME_PAYMENTS_CHAIN_ID);
				return DEFAULT_HTML_RESPONSE;
			}

			val state = gson.toJson(new FramePaymentMessage(flowWalletAddress, DEFAULT_FRAME_PAYMENTS_CHAIN_ID, null,
					null, null));

			return FrameResponse.builder()
					.imageUrl(profileImage)
					.postUrl(apiServiceUrl.concat(PAY_IN_FRAME_TOKEN))
					//.button(new FrameButton("ETH", FrameButton.ActionType.POST, null))
					.button(new FrameButton("USDC", FrameButton.ActionType.POST, null))
					.button(new FrameButton("DEGEN", FrameButton.ActionType.POST, null))
					.state(Base64.getEncoder().encodeToString(state.getBytes()))
					.build().toHtmlResponse();
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/pay/frame/token")
	public ResponseEntity<String> choosePaymentToken(@RequestBody FrameMessage frameMessage) {
		log.debug("Received choose payment token message request: {}", frameMessage);
		val validateMessage =
				farcasterHubService.validateFrameMessageWithNeynar(
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

		User casterProfile;
		if (clickedFid != casterFid) {
			casterProfile =
					frameService.getFidProfile(casterFid, null);
		} else {
			casterProfile = profiles.stream().findFirst().orElse(null);
		}

		var state = gson.fromJson(
				new String(Base64.getDecoder().decode(validateMessage.action().state().serialized())),
				FramePaymentMessage.class);

		if (casterProfile != null && state != null) {
			val token = switch (buttonIndex) {
				//case 1 -> ETH_TOKEN;
				case 1 -> USDC_TOKEN;
				case 2 -> DEGEN_TOKEN;
				default -> null;
			};

			if (token != null) {
				val updatedState = gson.toJson(new FramePaymentMessage(state.address(),
						state.chainId(), token, null, null));
				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
								"/payment.png?step=amount&chainId=%s&token=%s",
						casterProfile.getIdentity(), BASE_CHAIN_ID, token));
				return FrameResponse.builder()
						.textInput("Enter amount, $ (1-10)")
						.postUrl(apiServiceUrl.concat(PAY_IN_FRAME_AMOUNT))
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

	@PostMapping("/pay/frame/amount")
	public ResponseEntity<String> paymentAmount(@RequestBody FrameMessage frameMessage) {
		log.debug("Received enter payment amount message request: {}", frameMessage);
		val validateMessage =
				farcasterHubService.validateFrameMessageWithNeynar(
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

		User casterProfile;
		if (clickedFid != casterFid) {
			casterProfile =
					frameService.getFidProfile(casterFid, null);
		} else {
			casterProfile = profiles.stream().findFirst().orElse(null);
		}

		var state = gson.fromJson(
				new String(Base64.getDecoder().decode(validateMessage.action().state().serialized())),
				FramePaymentMessage.class);

		if (casterProfile != null && state != null) {
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
				val casterFcName = frameService.getFidFname(casterFid);
				val tokenAmount = roundTokenAmount(
						usdAmount / transactionService.getPrice(state.token()));

				val payment = new Payment(Payment.PaymentType.FRAME, casterProfile,
						state.chainId(), state.token());

				payment.setUsdAmount(state.usdAmount().toString());
				payment.setSourceApp(validateMessage.action().signer().client().displayName());
				payment.setSourceRef(String.format("https://warpcast.com/%s/%s",
						casterFcName, validateMessage.action().cast().hash().substring(0, 10)));

				paymentRepository.save(payment);

				val refId = payment.getReferenceId();
				val updatedState = gson.toJson(new FramePaymentMessage(state.address(),
						state.chainId(), state.token(), usdAmount, refId));
				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
								"/payment.png?step=confirm&chainId=%s&token=%s&usdAmount=%s&amount=%s",
						casterProfile.getIdentity(), state.chainId(), state.token(), usdAmount, tokenAmount));
				val frameResponseBuilder = FrameResponse.builder()
						.postUrl(apiServiceUrl.concat(PAY_IN_FRAME_CONFIRM))
						.button(new FrameButton("Pay now", FrameButton.ActionType.TX,
								apiServiceUrl.concat(PAY_IN_FRAME_CONFIRM)))
						.imageUrl(profileImage)
						.state(Base64.getEncoder().encodeToString(updatedState.getBytes()));

				// for now just check if profile exists
				if (!profiles.isEmpty()) {
					frameResponseBuilder.button(new FrameButton("Pay later \uD83D\uDD51",
							FrameButton.ActionType.POST,
							apiServiceUrl.concat(PAY_IN_FRAME_CONFIRM)));
				}

				return frameResponseBuilder.build().toHtmlResponse();
			} else {
				val updatedState = gson.toJson(new FramePaymentMessage(state.address(),
						state.chainId(), state.token(), usdAmount, null));

				val tokenAmount = usdAmount != null ? roundTokenAmount(
						usdAmount / transactionService.getPrice(state.token())) : "";

				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
								"/payment.png?step=amount&chainId=%s&token=%s&usdAmount=%s&amount=%s",
						casterProfile.getIdentity(), state.chainId(), state.token(),
						usdAmount != null ? usdAmount : "", tokenAmount));
				return FrameResponse.builder()
						.textInput(String.format("Enter amount%s, $ (1-10)", usdAmount == null ?
								" again" : ""))
						.postUrl(apiServiceUrl.concat(PAY_IN_FRAME_AMOUNT))
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

	@PostMapping("/pay/frame/confirm")
	public ResponseEntity<String> paymentConfirm(@RequestBody FrameMessage frameMessage) {
		log.debug("Received payment confirm message request: {}", frameMessage);
		val validateMessage =
				farcasterHubService.validateFrameMessageWithNeynar(
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
		val transactionId = validateMessage.action().transaction() != null ?
				validateMessage.action().transaction().hash() : null;

		val addresses = frameService.getFidAddresses(clickedFid);
		val profiles = frameService.getFidProfiles(addresses);

		User casterProfile;
		if (clickedFid != casterFid) {
			casterProfile =
					frameService.getFidProfile(casterFid, null);

		} else {
			casterProfile = profiles.stream().findFirst().orElse(null);
		}

		var state = gson.fromJson(
				new String(Base64.getDecoder().decode(validateMessage.action().state().serialized())),
				FramePaymentMessage.class);

		if (casterProfile != null && state != null) {
			log.debug("Previous payment state: {}", state);
			if (isFramePaymentMessageComplete(state)) {
				val flowWalletAddress =
						casterProfile.getDefaultFlow().getWallets().stream()
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
							casterProfile.getIdentity(), state.chainId(), state.token(),
							state.usdAmount(), tokenAmount, "success"));
					return FrameResponse.builder()
							.imageUrl(profileImage)
							.textInput("Enter your comment")
							.button(new FrameButton("\uD83D\uDCAC Add comment",
									FrameButton.ActionType.POST,
									apiServiceUrl.concat(PAY_IN_FRAME_COMMENT)))
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
							casterProfile.getIdentity(), state.chainId(), state.token(),
							state.usdAmount(), tokenAmount));
					return FrameResponse.builder()
							.imageUrl(profileImage)
							.button(new FrameButton("\uD83D\uDCF1 App",
									FrameButton.ActionType.LINK, dAppServiceUrl))
							.build().toHtmlResponse();
				}
			} else {
				log.error("Frame payment message is not complete or valid: {}", state);
			}
		}

		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/pay/frame/comment")
	public ResponseEntity<String> paymentComment(@RequestBody FrameMessage frameMessage) {
		log.debug("Received payment comment message request: {}", frameMessage);
		val validateMessage =
				farcasterHubService.validateFrameMessageWithNeynar(
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

		User casterProfile;
		if (clickedFid != casterFid) {
			casterProfile =
					frameService.getFidProfile(casterFid, null);
		} else {
			casterProfile = profiles.stream().findFirst().orElse(null);
		}

		var state = gson.fromJson(
				new String(Base64.getDecoder().decode(validateMessage.action().state().serialized())),
				FramePaymentMessage.class);

		if (casterProfile != null && state != null) {
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
							casterProfile.getIdentity(), state.chainId(), state.token(),
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
										apiServiceUrl.concat(PAY_IN_FRAME_COMMENT)));
					}
					return frameResponseBuilder.build().toHtmlResponse();
				}
			} else {
				log.debug("Frame payment message is not complete or valid: {}", state);
			}
		}

		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/actions")
	public ResponseEntity<String> actions(@RequestBody FrameMessage frameMessage) {
		log.debug("Received actions frame: {}", frameMessage);

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
		val profiles = frameService.getFidProfiles(clickedFid);

		if (!profiles.isEmpty()) {
			if (buttonIndex > 0 && buttonIndex <= profiles.size()) {
				val clickedProfile = profiles.get(buttonIndex - 1);
				val postUrl = apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS,
						clickedProfile.getIdentity()));

				val profileLink = dAppServiceUrl.concat(String.format("/%s",
						clickedProfile.getUsername()));
				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
								"/image.png",
						clickedProfile.getIdentity()));

				val responseBuilder = FrameResponse.builder().imageUrl(profileImage).postUrl(postUrl)
						.button(new FrameButton("\uD83D\uDCB0 Balance", FrameButton.ActionType.POST,
								null))
						.button(new FrameButton("\uD83D\uDC8C Invite",
								FrameButton.ActionType.POST, null))
						.button(new FrameButton("\uD83C\uDF81 Gift", FrameButton.ActionType.POST,
								null))
						.button(new FrameButton("Profile",
								FrameButton.ActionType.LINK,
								profileLink));

				return responseBuilder.build().toHtmlResponse();
			}
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/actions/{identity}")
	public ResponseEntity<String> identityAction(@PathVariable String identity,
	                                             @RequestBody FrameMessage frameMessage) {
		log.debug("Received actions frame: {}", frameMessage);

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
		val clickedProfile = frameService.getFidProfile(clickedFid, identity);

		if (clickedProfile != null && buttonIndex > 0 && buttonIndex <= 3) {
			val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
							"/image.png",
					clickedProfile.getIdentity()));

			switch (buttonIndex) {
				// balance
				case 1:
					log.debug("Handling balance action: {}", validateMessage);
					val defaultFlow = clickedProfile.getDefaultFlow();
					AtomicReference<Map<String, String>> balances = new AtomicReference<>();
					if (defaultFlow != null) {
						defaultFlow.getWallets().stream()
								.filter(w -> w.getNetwork() == 8453).findFirst()
								.ifPresent(flowBaseWallet -> {
									balances.set(transactionService.getWalletBalance(flowBaseWallet.getAddress()));
								});
					}
					if (balances.get() != null) {
						val balanceImageBase = framesServiceUrl.concat(String.format("/images" +
										"/profile" +
										"/%s" +
										"/balance.png",
								clickedProfile.getIdentity()));
						val balanceImageBuilder =
								UriComponentsBuilder.fromHttpUrl(balanceImageBase);
						balances.get().forEach(balanceImageBuilder::queryParam);
						val balanceImage = balanceImageBuilder.build().toUriString();
						val giftPostUrl =
								apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_BACK,
										clickedProfile.getIdentity()));
						return FrameResponse.builder().imageUrl(balanceImage)
								.postUrl(giftPostUrl)
								.button(BACK_FRAME_BUTTON)
								.build().toHtmlResponse();
					}
					break;
				// invites
				case 2:
					log.debug("Handling invitation action: {}", validateMessage);
					val invitePostUrl =
							apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_INVITE,
									clickedProfile.getIdentity()));
					return FrameResponse.builder().imageUrl(profileImage)
							.postUrl(invitePostUrl)
							.textInput("Enter farcaster username")
							.button(BACK_FRAME_BUTTON)
							.button(new FrameButton(
									"Submit", FrameButton.ActionType.POST, null))
							.build().toHtmlResponse();
				// gifts
				case 3:
					log.debug("Handling gift action: {}", validateMessage);
					val giftImage = framesServiceUrl.concat(String.format("/images/profile/%s/gift/image.png",
							clickedProfile.getIdentity()));
					val giftPostUrl =
							apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_GIFT,
									clickedProfile.getIdentity()));
					return FrameResponse.builder().imageUrl(giftImage)
							.postUrl(giftPostUrl)
							.button(new FrameButton(
									"\uD83C\uDFB2 Spin a gift", FrameButton.ActionType.POST, null))
							.button(new FrameButton(
									"\uD83C\uDFC6 Leaderboard", FrameButton.ActionType.POST, null))
							.build().toHtmlResponse();
			}
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/actions/{identity}/back")
	public ResponseEntity<String> handleActionsBackAction(@PathVariable String identity,
	                                                      @RequestBody FrameMessage frameMessage) {
		log.debug("Received actions back frame: {}", frameMessage);

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
		val clickedProfile = frameService.getFidProfile(clickedFid, identity);
		if (clickedProfile != null) {
			if (buttonIndex == 1) {
				val postUrl = apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS,
						clickedProfile.getIdentity()));
				val profileLink = dAppServiceUrl.concat(String.format("/%s",
						clickedProfile.getUsername()));
				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
								"/image.png",
						clickedProfile.getIdentity()));
				val responseBuilder = FrameResponse.builder().imageUrl(profileImage).postUrl(postUrl)
						.button(new FrameButton("\uD83D\uDCB0 Balance", FrameButton.ActionType.POST,
								null))
						.button(new FrameButton("\uD83D\uDC8C Invite",
								FrameButton.ActionType.POST, null))
						.button(new FrameButton("\uD83C\uDF81 Gift", FrameButton.ActionType.POST,
								null))
						.button(new FrameButton("Profile",
								FrameButton.ActionType.LINK,
								profileLink));
				return responseBuilder.build().toHtmlResponse();
				// TODO: a bit hacky, as other frames might also have additional buttons besides
				//  back button
			} else if (buttonIndex == 2) {
				log.debug("Handling gift leaderboard action: {}", validateMessage);
				val leaderboardImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
						"/gift/leaderboard.png", clickedProfile.getIdentity()));
				val giftPostUrl =
						apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_GIFT_BACK,
								clickedProfile.getIdentity()));
				return FrameResponse.builder()
						.imageUrl(leaderboardImage).cacheImage(false)
						.postUrl(giftPostUrl)
						.button(BACK_FRAME_BUTTON)
						.build().toHtmlResponse();
			}
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/actions/{identity}/gift")
	public ResponseEntity<String> handleGiftAction(@PathVariable String identity,
	                                               @RequestBody FrameMessage frameMessage) {
		log.debug("Received actions gift frame: {}", frameMessage);

		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val buttonIndex = validateMessage.action().tappedButton().index();
		val clickedFid = validateMessage.action().interactor().fid();
		val clickedProfile = frameService.getFidProfile(clickedFid, identity);
		if (clickedProfile != null) {

			if (buttonIndex == 1) {
				log.debug("Handling gift spin action: {}", validateMessage);
				var giftImage = "";

				val responseBuilder = FrameResponse.builder();
				try {
					val giftedContact = frameService.giftSpin(clickedProfile);
					giftImage = framesServiceUrl.concat(String.format("/images/profile/%s/gift" +
									"/%s/image.png",
							clickedProfile.getIdentity(), giftedContact.address()));
					val giftPostUrl =
							apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_GIFT,
									clickedProfile.getIdentity()));
					responseBuilder.imageUrl(giftImage)
							.postUrl(giftPostUrl)
							.button(new FrameButton(
									"\uD83C\uDFB2 Spin one more time",
									FrameButton.ActionType.POST,
									null));
				} catch (Exception error) {
					giftImage = framesServiceUrl.concat(String.format("/images/profile/%s/gift/image.png?error=%s",
							clickedProfile.getIdentity(),
							error.getMessage()));
					val giftPostUrl =
							apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_BACK,
									clickedProfile.getIdentity()));
					responseBuilder.imageUrl(giftImage)
							.postUrl(giftPostUrl)
							.button(BACK_FRAME_BUTTON);
				}

				return responseBuilder
						.button(new FrameButton(
								"\uD83C\uDFC6 Leaderboard", FrameButton.ActionType.POST, null))
						.build().toHtmlResponse();
			} else if (buttonIndex == 2) {
				log.debug("Handling gift leaderboard action: {}", validateMessage);
				val leaderboardImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
						"/gift/leaderboard.png", clickedProfile.getIdentity()));
				val giftPostUrl =
						apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_GIFT_BACK,
								clickedProfile.getIdentity()));
				return FrameResponse.builder()
						.imageUrl(leaderboardImage).cacheImage(false)
						.postUrl(giftPostUrl)
						.button(BACK_FRAME_BUTTON)
						.build().toHtmlResponse();
			}
		}

		return DEFAULT_HTML_RESPONSE;
	}

	@GetMapping("/gift/{identity}/leaderboard")
	public List<GiftProfileMessage> getGiftLeaderboard(@PathVariable String identity) {
		log.debug("Received get gift leaderboard request from: {}", identity);

		try {
			val allGifts = giftRepository.findAllBy();

			// Group gifts by the profile user
			Map<User, List<Gift>> giftsByGiftedUser = allGifts.stream()
					.collect(Collectors.groupingBy(Gift::getGifted));

			// Convert each group into GiftProfileMessage
			return giftsByGiftedUser.entrySet().stream()
					.map(entry -> new GiftProfileMessage(
							ProfileMessage.convert(entry.getKey()),
							entry.getValue().stream()
									.map(gift -> new GiftProfileMessage.GiftMessage(ProfileMessage.convert(gift.getGifter()), gift.getToken()))
									.collect(Collectors.toList())
					))
					.sorted(Comparator.comparing(gpm -> gpm.gifts().size(), Comparator.reverseOrder()))
					.collect(Collectors.toList());
		} catch (Exception e) {
			log.error("Error:", e);
		}

		return Collections.emptyList();
	}

	@PostMapping("/actions/{identity}/gift/back")
	public ResponseEntity<String> handleGiftBackAction(@PathVariable String identity,
	                                                   @RequestBody FrameMessage frameMessage) {
		log.debug("Received actions gift back frame: {}", frameMessage);

		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val buttonIndex = validateMessage.action().tappedButton().index();
		val clickedFid = validateMessage.action().interactor().fid();
		val clickedProfile = frameService.getFidProfile(clickedFid, identity);
		if (clickedProfile != null) {
			if (buttonIndex == 1) {

				log.debug("Handling gift back action: {}", validateMessage);

				val giftImage = framesServiceUrl.concat(String.format("/images/profile/%s/gift/image.png",
						clickedProfile.getIdentity()));
				val giftPostUrl =
						apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_GIFT,
								clickedProfile.getIdentity()));
				return FrameResponse.builder().imageUrl(giftImage)
						.postUrl(giftPostUrl)
						.button(new FrameButton(
								"\uD83C\uDFB2 Spin a gift ", FrameButton.ActionType.POST, null))
						.button(new FrameButton(
								"\uD83C\uDFC6 Leaderboard ", FrameButton.ActionType.POST, null))
						.build().toHtmlResponse();
			}
		}

		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/actions/{identity}/invite")
	public ResponseEntity<String> identityActionInvite(@PathVariable String identity,
	                                                   @RequestBody FrameMessage frameMessage) {
		log.debug("Received actions invite frame: {}", frameMessage);
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
		val input = validateMessage.action().input();
		val inputText = input != null ? input.text() : null;
		val clickedProfile = frameService.getFidProfile(clickedFid, identity);

		if (clickedProfile != null) {
			val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
							"/image.png",
					clickedProfile.getIdentity()));
			if (buttonIndex == 1) {
				val postUrl = apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS,
						clickedProfile.getIdentity()));
				val profileLink = dAppServiceUrl.concat(String.format("/%s",
						clickedProfile.getUsername()));

				val responseBuilder = FrameResponse.builder().imageUrl(profileImage).postUrl(postUrl)
						.button(new FrameButton("\uD83D\uDCB0 Balance", FrameButton.ActionType.POST,
								null))
						.button(new FrameButton("\uD83D\uDC8C Invite",
								FrameButton.ActionType.POST, null))
						.button(new FrameButton("\uD83C\uDF81 Gift", FrameButton.ActionType.POST,
								null))
						.button(new FrameButton("Profile",
								FrameButton.ActionType.LINK,
								profileLink));
				return responseBuilder.build().toHtmlResponse();
			} else if (buttonIndex == 2) {
				if (!StringUtils.isBlank(inputText)) {
					// check if profile exist
					val inviteProfile = frameService.getFidProfile(inputText, identity);
					if (inviteProfile != null) {
						return FrameResponse.builder().imageUrl(profileImage)
								.button(new FrameButton(String.format("✅ %s already signed up",
										inputText), FrameButton.ActionType.POST, null)).build().toHtmlResponse();
					} else {
						// check if invited
						val inviteAddresses = frameService.getFnameAddresses(inputText);
						val invitations = contactBookService.filterByInvited(inviteAddresses);
						if (!invitations.isEmpty()) {
							return FrameResponse.builder().imageUrl(profileImage)
									.button(new FrameButton(String.format("✅ %s already invited",
											inputText), FrameButton.ActionType.POST, null)).build().toHtmlResponse();
						} else {
							// for now invite first
							val identityToInvite =
									identityService.getIdentitiesInfo(inviteAddresses).stream().sorted(Comparator.comparingInt(IdentityMessage::score).reversed()).toList().getFirst();
							log.debug("Identity to invite: {} ", identityToInvite);

							val invitation = new Invitation(identityToInvite.address(), null);
							invitation.setInvitedBy(clickedProfile);
							invitation.setExpiryDate(new Date(System.currentTimeMillis() + TimeUnit.DAYS.toMillis(30)));
							invitationRepository.save(invitation);

							return FrameResponse.builder().imageUrl(profileImage)
									.button(new FrameButton(String.format("🎉 Successfully invited %s to Payflow",
											inputText), FrameButton.ActionType.POST, null)).build().toHtmlResponse();
						}
					}
				} else {
					val postUrl = apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_INVITE,
							clickedProfile.getIdentity()));

					return FrameResponse.builder().imageUrl(profileImage)
							.postUrl(postUrl)
							.textInput("Enter farcaster username")
							.button(BACK_FRAME_BUTTON)
							.button(new FrameButton(
									"Empty username, submit again", FrameButton.ActionType.POST, null))
							.build().toHtmlResponse();
				}
			}
		}
		return DEFAULT_HTML_RESPONSE;
	}
}
