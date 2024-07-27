package ua.sinaver.web3.payflow.controller.composer;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.message.farcaster.ComposerActionState;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.UserService;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/farcaster/composer/payment")
@Transactional
@Slf4j
public class ReceivePaymentFormController {
	private static final Gson GSON = new GsonBuilder().create();
	@Autowired
	private IFarcasterNeynarService neynarService;

	@Autowired
	private IdentityService identityService;

	@Autowired
	private UserService userService;

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
		val profile = identityService.getProfiles(validateMessage.action().interactor().addressesWithoutCustodialIfAvailable()).stream().findFirst().orElse(null);
		var accessToken = "";
		if (profile != null) {
			accessToken = userService.generateAccessToken(profile);
		}

		val decodedState = URLDecoder.decode(
				validateMessage.action().state().serialized(), StandardCharsets.UTF_8);
		log.debug("Decoded form state: {}", decodedState);

		val state = GSON.fromJson(decodedState, ComposerActionState.class);
		val paymentFormUrl = UriComponentsBuilder.newInstance()
				.scheme("https").host("app.payflow.me").path("/composer")
				.queryParam("access_token", accessToken)
				.queryParam("action", "frame")
				.queryParam("verifications", interactor.addressesWithoutCustodialIfAvailable())
				.queryParam("title", state.cast().text())
				.build()
				.toUriString();

		log.debug("Returning a composer payment form url for: {} - {}", interactor.username(), paymentFormUrl);

		return ResponseEntity.ok().body(new FrameResponse.ComposerActionForm(
				"form", "Payment Frame", paymentFormUrl));
	}
}
