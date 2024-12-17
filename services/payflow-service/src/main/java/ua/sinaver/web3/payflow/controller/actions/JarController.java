package ua.sinaver.web3.payflow.controller.actions;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.message.farcaster.CastActionMeta;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.service.FarcasterNeynarService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

@RestController
@RequestMapping("/farcaster/actions/jar")
@Transactional
@Slf4j
public class JarController {

	private final static CastActionMeta JAR_CAST_ACTION_META = new CastActionMeta(
			"Create Jar", "beaker",
			"Use this action to turn any existing cast into contribution jar " +
					"to fundraise for any purpose via Payflow",
			"https://app.payflow.me/actions",
			new CastActionMeta.Action("post"));

	@Autowired
	private FarcasterNeynarService neynarService;
	@Autowired
	private IIdentityService identityService;

	@GetMapping
	public CastActionMeta metadata() {
		log.debug("Received metadata request for cast action: create jar");
		return JAR_CAST_ACTION_META;
	}

	@PostMapping
	public ResponseEntity<?> create(@RequestBody FrameMessage castActionMessage) {
		log.debug("Received cast action: jar {}", castActionMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				castActionMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Cast action not verified!"));
		}

		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val castInteractor = validateMessage.action().interactor();
		val castAuthor = validateMessage.action().cast().author() != null ?
				validateMessage.action().cast().author() :
				neynarService.fetchFarcasterUser(validateMessage.action().cast().fid());

		if (castInteractor.fid() != castAuthor.fid()) {
			log.error("Only the author of the cast is allowed to create the contribution " +
					"jar for it - clicked fid {} vs caster fid {} ", castInteractor, castAuthor);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Use only for your casts!"));
		}

		val clickedProfile =
				identityService.getProfiles(castInteractor.addressesWithoutCustodialIfAvailable()).stream().findFirst().orElse(null);
		if (clickedProfile == null) {
			log.error("Clicked fid {} is not on payflow", castInteractor);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Sign up on Payflow first!"));
		}

		// just responding with dummy frame
		return ResponseEntity.ok().body(
				new FrameResponse.ActionFrame("frame", "https://frames.payflow.me/jar/create"));
	}
}
