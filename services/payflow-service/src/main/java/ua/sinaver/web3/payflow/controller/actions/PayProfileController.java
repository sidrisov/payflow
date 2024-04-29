package ua.sinaver.web3.payflow.controller.actions;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.message.CastActionMeta;
import ua.sinaver.web3.payflow.message.FrameMessage;
import ua.sinaver.web3.payflow.service.api.IFarcasterHubService;
import ua.sinaver.web3.payflow.service.api.IFrameService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

@RestController
@RequestMapping("/farcaster/actions/profile")
@Transactional
@Slf4j
public class PayProfileController {

	private final static CastActionMeta PAY_PROFILE_CAST_ACTION_META = new CastActionMeta(
			"Pay Profile", "person",
			"Use this action to pay payflow profile of the cast author",
			"https://payflow.me",
			new CastActionMeta.Action("post"));

	@Autowired
	private IFarcasterHubService farcasterHubService;
	@Autowired
	private IFrameService frameService;

	@GetMapping
	public CastActionMeta metadata() {
		log.debug("Received metadata request for cast action: pay profile");
		return PAY_PROFILE_CAST_ACTION_META;
	}

	@PostMapping
	public ResponseEntity<?> create(@RequestBody FrameMessage castActionMessage) {
		log.debug("Received cast action: pay profile {}", castActionMessage);
		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				castActionMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameError("Cast action not verified!"));
		}

		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val casterFid = validateMessage.action().cast().fid();
		val clickedProfile = frameService.getFidProfiles(casterFid).stream().findFirst().orElse(null);
		if (clickedProfile == null) {
			log.error("Caster fid {} is not on Payflow", casterFid);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameError("User not on Payflow! Invite :)"));
		}

		// just responding with dummy frame
		return ResponseEntity.ok().body(
				new FrameResponse.ActionFrame("frame", String.format("https://frames.payflow" +
						".me/%s", clickedProfile.getUsername())));
	}
}
