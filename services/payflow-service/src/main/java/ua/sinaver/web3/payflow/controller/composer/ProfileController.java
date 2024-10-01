package ua.sinaver.web3.payflow.controller.composer;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.message.farcaster.ComposerActionState;
import ua.sinaver.web3.payflow.message.farcaster.ComposerCastActionMeta;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.UserService;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.Date;

@RestController
@RequestMapping("/farcaster/composer/page")
@Transactional
@Slf4j
public class ProfileController {
	private static final Gson GSON = new GsonBuilder().create();
	private final static ComposerCastActionMeta PAY_COMPOSER_CAST_ACTION_META = new ComposerCastActionMeta(
			"composer",
			"Payflow Profile",
			"zap",
			"Display payment page",
			"https://payflow.me",
			"https://payflow.me/apple-touch-icon.png",
			new ComposerCastActionMeta.Action("post"));
	@Autowired
	private IFarcasterNeynarService neynarService;
	@Autowired
	private IdentityService identityService;
	@Autowired
	private UserService userService;

	@GetMapping
	public ComposerCastActionMeta metadata() {
		log.debug("Received metadata request for composer cast action - pay - returning: {}",
				PAY_COMPOSER_CAST_ACTION_META);
		return PAY_COMPOSER_CAST_ACTION_META;
	}

	@PostMapping
	public ResponseEntity<?> form(@RequestBody FrameMessage composerActionMessage) {
		log.debug("Received composer action: payment form {}", composerActionMessage);
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
		User profile =
				identityService.getProfiles(validateMessage.action().interactor().addressesWithoutCustodialIfAvailable()).stream().findFirst().orElse(null);
		var accessToken = "";
		if (profile == null) {
			// for now invite first
			val identityToCreateProfile = identityService.getIdentitiesInfo(validateMessage.action().interactor().addressesWithoutCustodialIfAvailable())
					.stream().max(Comparator.comparingInt(IdentityMessage::score))
					.orElse(null);
			if (identityToCreateProfile == null) {
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("Something went wrong! Please, contact " +
								"@sinaver.eth on Warpcast \uD83D\uDE4F\uD83C\uDFFB"));
			}

			log.debug("Identity to create profile for interactor: {} : {}",
					interactor,
					identityToCreateProfile);

			profile = new User(identityToCreateProfile.address());
			profile.setAllowed(true);
			profile.setUsername(interactor.username().replace(".eth", ""));
			profile.setDisplayName(interactor.displayName());
			profile.setProfileImage(interactor.pfpUrl());
			profile.setDefaultReceivingAddress(identityToCreateProfile.address());
			profile.setLastSeen(new Date());
			userService.saveUser(profile);
		}
		accessToken = userService.generateAccessToken(profile);
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

		val paymentFormUrl = UriComponentsBuilder.newInstance()
				.scheme("https").host("app.payflow.me")
				.path("/{recipient}?pay") // add your path variables here
				.buildAndExpand("0x0dEe77c83cB8b14fA95497825dF93202AbF6ad83")
				.toUriString();

		log.debug("Returning a composer payment form url for: {} - {}", interactor.username(), paymentFormUrl);

		return ResponseEntity.ok().body(new FrameResponse.ComposerActionForm(
				"form", "Create Payment Frame", paymentFormUrl));
	}

	private String determineRecipientIdentity(FarcasterUser user) {
		val paymentAddresses =
				identityService.getIdentitiesInfo(user.addressesWithoutCustodialIfAvailable())
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
