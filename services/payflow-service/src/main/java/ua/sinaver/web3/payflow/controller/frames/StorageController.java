package ua.sinaver.web3.payflow.controller.frames;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.entity.Payment;
import ua.sinaver.web3.payflow.entity.User;
import ua.sinaver.web3.payflow.graphql.generated.types.SocialDappName;
import ua.sinaver.web3.payflow.message.FrameButton;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.message.farcaster.ValidatedFrameResponseMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.FarcasterNeynarService;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.LinkService;
import ua.sinaver.web3.payflow.service.UserService;
import ua.sinaver.web3.payflow.utils.FrameResponse;
import ua.sinaver.web3.payflow.utils.FrameVersions;

import java.util.Optional;

import static ua.sinaver.web3.payflow.controller.frames.FramesController.DEFAULT_HTML_RESPONSE;
import static ua.sinaver.web3.payflow.service.TokenService.ETH_TOKEN;
import static ua.sinaver.web3.payflow.service.TokenService.OP_CHAIN_ID;

@RestController
@RequestMapping("/farcaster/frames/storage")
@CrossOrigin(origins = "*", allowCredentials = "false")
@Transactional
@Slf4j
public class StorageController {

	private static final String STORAGE_FRAME_API_BASE = "/api/farcaster/frames/storage";
	@Autowired
	private FarcasterNeynarService neynarService;
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

	private static Payment getPayment(ValidatedFrameResponseMessage validateMessage,
	                                  FarcasterUser gifteeUser, User clickedProfile) {
		val sourceApp = validateMessage.action().signer().client().displayName();
		val castHash = validateMessage.action().cast().hash();
		// maybe would make sense to reference top cast instead (if it's a bot cast)
		val sourceRef = String.format("https://warpcast.com/%s/%s",
				gifteeUser.username(), castHash.substring(0,
						10));

		// TODO: save instead as fulfillmentChainId + fulfillmentTokenId
		val payment = new Payment(Payment.PaymentType.INTENT,
				null, OP_CHAIN_ID, ETH_TOKEN);
		payment.setCategory("fc_storage");
		// use token amount as storage unit number
		payment.setTokenAmount("1");
		payment.setReceiverFid(gifteeUser.fid());
		payment.setSender(clickedProfile);
		payment.setSourceApp(sourceApp);
		payment.setSourceRef(sourceRef);
		payment.setSourceHash(castHash);
		return payment;
	}

	@PostMapping("/{fid}/submit")
	public ResponseEntity<?> submit(@RequestBody FrameMessage frameMessage,
	                                @PathVariable Integer fid) {
		log.debug("Received submit gift storage message request: {}", frameMessage);
		val validateMessage = neynarService.validaFrameRequest(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val gifteeUser = neynarService.fetchFarcasterUser(fid);
		val interactor = validateMessage.action().interactor();

		User clickedProfile;
		try {
			clickedProfile = userService.getOrCreateUserFromFarcasterProfile(interactor,
					false);
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

		val payment = getPayment(validateMessage, gifteeUser, clickedProfile);
		paymentRepository.save(payment);

		log.debug("Gift storage payment intent saved: {}", payment);

		val paymentLink = linkService.paymentLink(payment, validateMessage, false);
		log.debug("Redirecting to {}", paymentLink);
		return ResponseEntity.status(HttpStatus.FOUND).location(paymentLink).build();
	}

	@PostMapping("/check")
	public ResponseEntity<?> check(@RequestBody FrameMessage frameMessage) {
		log.debug("Received check storage message request: {}", frameMessage);
		val validateMessage = neynarService.validaFrameRequest(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		var castInteractorFid = validateMessage.action().interactor().fid();
		val recipientText = Optional.ofNullable(validateMessage.action().input())
				.map(input -> input.text().trim().toLowerCase())
				.orElse(null);

		// TODO: refactor this!
		var receiverFid = (Integer) null;
		if (StringUtils.isNotBlank(recipientText)) {
			val addresses = identityService.getFnameAddresses(recipientText);
			val identity = identityService.getHighestScoredIdentityInfo(addresses);
			if (identity == null) {
				log.error("Farcaster user not found: {}", recipientText);
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("User not found, enter again!"));
			} else {
				receiverFid = identity.meta().socials().stream()
						.filter(s -> SocialDappName.farcaster.name().equals(s.dappName()))
						.map(s -> {
							try {
								return Integer.parseInt(s.profileId());
							} catch (NumberFormatException e) {
								return null;
							}
						})
						.findFirst()
						.orElse(null);
				if (receiverFid == null) {
					log.error("Farcaster user not found: {}", recipientText);
					return ResponseEntity.badRequest().body(
							new FrameResponse.FrameMessage("User not found, enter again!"));
				}
			}
		} else {
			receiverFid = validateMessage.action().interactor().fid();
		}

		val storageImage = UriComponentsBuilder.fromHttpUrl(payflowConfig.getFramesServiceUrl())
				.path("images/profile/fid/{fid}/storage.png?" + FrameVersions.STORAGE_VERSION)
				.buildAndExpand(receiverFid)
				.toUriString();

		val submitUrl = UriComponentsBuilder.fromHttpUrl(payflowConfig.getApiServiceUrl())
				.path(STORAGE_FRAME_API_BASE)
				.path("/{fid}/submit")
				.buildAndExpand(receiverFid)
				.toUriString();

		val checkUrl = UriComponentsBuilder.fromHttpUrl(payflowConfig.getApiServiceUrl())
				.path(STORAGE_FRAME_API_BASE)
				.path("/check")
				.toUriString();

		return FrameResponse.builder().imageUrl(storageImage)
				.button(new FrameButton(
						"Buy",
						FrameButton.ActionType.POST_REDIRECT,
						submitUrl))
				.button(new FrameButton(
						"My usage",
						FrameButton.ActionType.POST,
						checkUrl))
				.build().toHtmlResponse();
	}
}
