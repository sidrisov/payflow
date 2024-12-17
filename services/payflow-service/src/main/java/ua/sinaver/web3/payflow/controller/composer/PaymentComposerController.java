package ua.sinaver.web3.payflow.controller.composer;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.message.farcaster.ComposerActionState;
import ua.sinaver.web3.payflow.message.farcaster.ComposerCastActionMeta;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.service.FarcasterNeynarService;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.UserService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;

@RestController
@RequestMapping("/farcaster/composer/pay")
@Transactional
@Slf4j
public class PaymentComposerController {
	private static final Gson GSON = new GsonBuilder().create();
	private final static ComposerCastActionMeta PAY_COMPOSER_CAST_ACTION_META = new ComposerCastActionMeta(
			"composer",
			"Payflow",
			"zap",
			"Onchain Social payments",
			"https://payflow.me",
			"https://payflow.me/apple-touch-icon.png",
			new ComposerCastActionMeta.Action("post"));

	@Autowired
	private FarcasterNeynarService neynarService;
	@Autowired
	private IdentityService identityService;
	@Autowired
	private UserService userService;

	@Autowired
	private PayflowConfig payflowConfig;

	@GetMapping
	public ComposerCastActionMeta metadata() {
		log.debug("Received metadata request for composer cast action - pay - returning: {}",
				PAY_COMPOSER_CAST_ACTION_META);
		return PAY_COMPOSER_CAST_ACTION_META;
	}

	@PostMapping
	public ResponseEntity<?> form(@RequestBody FrameMessage composerActionMessage,
	                              @RequestParam(required = false) String action,
	                              @RequestParam(required = false) String refId) {
		log.debug("Received composer action: payment form {} - action (optional): {}",
				composerActionMessage, action);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				composerActionMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Cast action not verified!"));
		}

		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val interactor = validateMessage.action().interactor();
		User profile;
		try {
			profile = userService.getOrCreateUserFromFarcasterProfile(interactor, true);
		} catch (IllegalArgumentException exception) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Missing verified identity! Contact @sinaver.eth"));
		} catch (ConstraintViolationException exception) {
			log.error("Failed to create a user for {}", interactor.username(), exception);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Identity conflict! Contact @sinaver.eth"));
		}

		val accessToken = userService.getOrGenerateAccessToken(profile);
		val decodedState = URLDecoder.decode(
				validateMessage.action().state().serialized(), StandardCharsets.UTF_8);
		log.debug("URL decoded form state: {}", decodedState);

		val state = GSON.fromJson(decodedState, ComposerActionState.class);
		log.debug("Json decoded form state: {}", decodedState);

		val hash = state.cast().parent() != null ? state.cast().parent().hash() : null;
		String recipient = "";
		if (StringUtils.isNotBlank(hash)) {
			val parentCast = neynarService.fetchCastByHash(hash);
			if (parentCast != null) {
				recipient = determineRecipientIdentity(parentCast.author());
			}
		}

		val miniAppUrl = StringUtils.isNotBlank(action) ? switch (action) {
			case "app" -> UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
					.path("/")
					.queryParam("mini")
					.queryParam("access_token", accessToken)
					.build()
					.toUriString();
			case "degen", "moxie" ->
					UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
							.path("/composer")
							.queryParam("mini")
							.queryParam("action", "earn")
							.queryParam("tab", action)
							.queryParam("access_token", accessToken)
							.build()
							.toUriString();
			case "payment" -> {
				if (StringUtils.isNotBlank(refId)) {
					yield UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
							.path("/payment/{refId}")
							.queryParam("mini")
							.queryParam("access_token", accessToken)
							.queryParam("view", "embedded")
							.buildAndExpand(refId)
							.toUriString();
				} else {
					yield null;
				}
			}
			case "storage", "notifications" ->
					UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
							.path("/farcaster/storage")
							.queryParam("mini")
							.queryParam("access_token", accessToken)
							.build()
							.toUriString();
			case "faq" ->
					"https://payflowlabs.notion.site/Payflow-FAQs-20593cf7734e4d78ad0dc91c8e8982e5";
			default -> StringUtils.isNotBlank(recipient)
					? UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
					.path("/payment/create")
					.queryParam("recipient", recipient)
					.queryParam("mini")
					.queryParam("access_token", accessToken)
					.build()
					.toUriString()
					: UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
					.path("/composer")
					.queryParam("mini")
					.queryParam("access_token", accessToken)
					.queryParam("action", action)
					.build()
					.toUriString();
		}
				: StringUtils.isNotBlank(recipient)
				? UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
				.path("/payment/create")
				.queryParam("recipient", recipient)
				.queryParam("mini")
				.queryParam("access_token", accessToken)
				.build()
				.toUriString()
				: UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
				.path("/composer")
				.queryParam("mini")
				.queryParam("access_token", accessToken)
				.queryParam("action", action)
				.build()
				.toUriString();

		if (miniAppUrl == null) {
			log.error("Action not supported: {} by {}", validateMessage,
					interactor.username());
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Action not supported!"));
		}

		log.debug("Returning a mini app url for: {} - {}", interactor.username(),
				miniAppUrl);

		return ResponseEntity.ok().body(new FrameResponse.ComposerActionForm(
				"form", "Payflow", miniAppUrl));
	}

	private String determineRecipientIdentity(FarcasterUser user) {
		val paymentAddresses = identityService.getIdentitiesInfo(user.addressesWithoutCustodialIfAvailable())
				.stream().sorted(Comparator.comparingInt(IdentityMessage::score))
				.map(IdentityMessage::address).toList();
		// check if profile exist
		val paymentProfile = identityService.getProfiles(paymentAddresses).stream().findFirst().orElse(null);
		if (paymentProfile == null || (paymentProfile.getDefaultFlow() == null
				&& paymentProfile.getDefaultReceivingAddress() == null)) {
			if (!paymentAddresses.isEmpty()) {
				// return first associated address
				return paymentAddresses.getFirst();
			} else {
				return null;
			}
		} else {
			// return profile identity
			return paymentProfile.getIdentity();
		}
	}
}
