package ua.sinaver.web3.payflow.controller.composer;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.entity.User;
import ua.sinaver.web3.payflow.message.farcaster.ComposerCastActionMeta;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.service.FarcasterNeynarService;
import ua.sinaver.web3.payflow.service.UserService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping({"/farcaster/composer/earn", "/farcaster/composer/useful"})
@Transactional
@Slf4j
public class EarnComposerController {
	private final static ComposerCastActionMeta EARN_COMPOSER_CAST_ACTION_META = new ComposerCastActionMeta(
			"composer",
			"Payflow Earn",
			"info",
			"Information for you",
			"https://payflow.me",
			"https://payflow.me/apple-touch-icon.png",
			new ComposerCastActionMeta.Action("post"));
	@Autowired
	private FarcasterNeynarService neynarService;
	@Autowired
	private UserService userService;

	@Autowired
	private PayflowConfig payflowConfig;

	@GetMapping
	public ComposerCastActionMeta metadata() {
		log.debug("Received metadata request for composer cast action - earn - returning: {}",
				EARN_COMPOSER_CAST_ACTION_META);

		log.debug("URL: {}", payflowConfig.getDAppServiceUrl());
		return EARN_COMPOSER_CAST_ACTION_META;
	}

	@PostMapping
	public ResponseEntity<?> form(@RequestBody FrameMessage composerActionMessage) {
		log.debug("Received composer action: earn form {}", composerActionMessage);
		val validateMessage = neynarService.validaFrameRequest(
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
					new FrameResponse.FrameMessage(
							"Missing verified identity! Contact @sinaver.eth"));
		} catch (ConstraintViolationException exception) {
			log.error("Failed to create a user for {}", interactor.username(), exception);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Identity conflict! Contact @sinaver.eth"));
		}

		val decodedState = URLDecoder.decode(
				validateMessage.action().state().serialized(), StandardCharsets.UTF_8);
		log.debug("URL decoded form state: {}", decodedState);
		val accessToken = userService.getOrGenerateAccessToken(profile);
		val earnFormUrl = UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
				.path("/composer")
				.queryParam("mini")
				.queryParam("access_token", accessToken)
				.queryParam("action", "earn")
				.build()
				.toUriString();

		log.debug("Returning earn composer form url for: {} - {}", interactor.username(),
				earnFormUrl);

		return ResponseEntity.ok().body(new FrameResponse.ComposerActionForm(
				"form", "Claim and Earn", earnFormUrl));
	}
}
