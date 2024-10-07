package ua.sinaver.web3.payflow.controller.frames;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.FanTokenService;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.LinkService;
import ua.sinaver.web3.payflow.service.UserService;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import static ua.sinaver.web3.payflow.controller.frames.FramesController.DEFAULT_HTML_RESPONSE;

@RestController
@RequestMapping("/farcaster/frames/hypersub")
@Transactional
@Slf4j
public class HypersubController {
	@Autowired
	private IFarcasterNeynarService neynarService;
	@Autowired
	private PaymentRepository paymentRepository;
	@Autowired
	private PayflowConfig payflowConfig;
	@Autowired
	private UserService userService;
	@Autowired
	private IdentityService identityService;
	@Autowired
	private LinkService linkService;
	@Autowired
	private FanTokenService fanTokenService;

	@PostMapping("/{id}/submit")
	public ResponseEntity<?> submit(@RequestBody FrameMessage frameMessage,
	                                @PathVariable String id) {
		log.debug("Received submit hypersub {} message request: {}", id, frameMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val interactor = validateMessage.action().interactor();

		User clickedProfile;
		try {
			clickedProfile = userService.getOrCreateUserFromFarcasterProfile(interactor,
					false, false);
		} catch (IllegalArgumentException exception) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Missing verified identity! Contact @sinaver.eth"));
		} catch (ConstraintViolationException exception) {
			log.error("Failed to create a user for {}", interactor.username(), exception);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Identity conflict! Contact @sinaver.eth"));
		}

		if (clickedProfile == null) {
			log.error("Clicked fid {} is not on payflow", interactor);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Sign up on Payflow first!"));
		}

		return ResponseEntity.badRequest().body(
				new FrameResponse.FrameMessage("Hypersub not implemented"));
	}

}
