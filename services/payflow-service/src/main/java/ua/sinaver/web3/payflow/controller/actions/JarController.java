package ua.sinaver.web3.payflow.controller.actions;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.message.CastActionMeta;
import ua.sinaver.web3.payflow.message.FrameMessage;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.service.FarcasterPaymentBotService;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.api.IContactBookService;
import ua.sinaver.web3.payflow.service.api.IFarcasterHubService;
import ua.sinaver.web3.payflow.service.api.IFrameService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

@RestController
@RequestMapping("/farcaster/actions/jar")
@Transactional
@Slf4j
public class JarController {

	private final static CastActionMeta JAR_CAST_ACTION_META = new CastActionMeta(
			"Create payflow jar", "beaker",
			"Use this action to turn any existing cast into contribution jar " +
					"to fundraise for any purpose via Payflow",
			"https://payflow.me",
			new CastActionMeta.Action("post"));

	@Autowired
	private IFarcasterHubService farcasterHubService;
	@Autowired
	private IFrameService frameService;
	@Autowired
	private IContactBookService contactBookService;
	@Autowired
	private IdentityService identityService;
	@Autowired
	private InvitationRepository invitationRepository;

	@Autowired
	private FarcasterPaymentBotService farcasterPaymentBotService;

	@GetMapping
	public CastActionMeta metadata() {
		log.debug("Received metadata request for cast action: create jar");
		return JAR_CAST_ACTION_META;
	}

	@PostMapping
	public ResponseEntity<?> create(@RequestBody FrameMessage castActionMessage) {
		log.debug("Received cast action: jar {}", castActionMessage);
		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				castActionMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameError("Cast action not verified!"));
		}

		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val clickedFid = validateMessage.action().interactor().fid();
		val casterFid = validateMessage.action().cast().fid();

		if (clickedFid != casterFid) {
			log.error("Only the author of the cast is allowed to create the contribution " +
					"jar for it - clicked fid {} vs caster fid {} ", clickedFid, casterFid);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameError("Use only for your casts!"));
		}

		val clickedProfile = frameService.getFidProfiles(clickedFid).stream().findFirst().orElse(null);
		if (clickedProfile == null) {
			log.error("Clicked fid {} is not on payflow", clickedFid);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameError("Sign up on Payflow first!"));
		}

		// just responding with dummy frame
		return ResponseEntity.ok().body(
				new FrameResponse.ActionFrame("frame", "https://frames.payflow.me/jar/create"));
	}
}
