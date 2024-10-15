package ua.sinaver.web3.payflow.controller.composer;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.farcaster.ComposerCastActionMeta;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.service.UserService;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/farcaster/composer/useful")
@Transactional
@Slf4j
public class UsefulComposerController {
	private static final Gson GSON = new GsonBuilder().create();
	private final static ComposerCastActionMeta USEFUL_COMPOSER_CAST_ACTION_META =
			new ComposerCastActionMeta(
					"composer",
					"Payflow Useful",
					"info",
					"Information for you",
					"https://payflow.me",
					"https://payflow.me/apple-touch-icon.png",
					new ComposerCastActionMeta.Action("post"));
	@Autowired
	private IFarcasterNeynarService neynarService;
	@Autowired
	private UserService userService;

	@Autowired
	private PayflowConfig payflowConfig;

	@GetMapping
	public ComposerCastActionMeta metadata() {
		log.debug("Received metadata request for composer cast action - useful - returning: {}",
				USEFUL_COMPOSER_CAST_ACTION_META);

		log.debug("URL: {}", payflowConfig.getDAppServiceUrl());
		return USEFUL_COMPOSER_CAST_ACTION_META;
	}

	@PostMapping
	public ResponseEntity<?> form(@RequestBody FrameMessage composerActionMessage) {
		log.debug("Received composer action: useful form {}", composerActionMessage);
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
			profile = userService.getOrCreateUserFromFarcasterProfile(interactor, true, true);
		} catch (IllegalArgumentException exception) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage(
							"Missing verified identity! Contact @sinaver.eth"));
		} catch (
				ConstraintViolationException exception) {
			log.error("Failed to create a user for {}", interactor.username(), exception);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Identity conflict! Contact @sinaver.eth"));
		}

		val decodedState = URLDecoder.decode(
				validateMessage.action().state().serialized(), StandardCharsets.UTF_8);
		log.debug("URL decoded form state: {}", decodedState);
		val accessToken = userService.getOrgenerateAccessToken(profile);
		val usefulFormUrl = UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
				.path("/composer")
				.queryParam("access_token", accessToken)
				.queryParam("action", "useful")
				.build()
				.toUriString();

		log.debug("Returning useful composer form url for: {} - {}", interactor.username(),
				usefulFormUrl);

		return ResponseEntity.ok().body(new FrameResponse.ComposerActionForm(
				"form", "Moxie / Degen Claim", usefulFormUrl));
	}
}
