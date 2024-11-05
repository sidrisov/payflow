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
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.graphql.generated.types.SocialDappName;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.message.farcaster.ValidatedFrameResponseMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.LinkService;
import ua.sinaver.web3.payflow.service.UserService;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.utils.FrameResponse;
import ua.sinaver.web3.payflow.utils.MintUrlUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static ua.sinaver.web3.payflow.config.PayflowConfig.MINIAPP_REDIRECT_ALLOWLIST;
import static ua.sinaver.web3.payflow.controller.frames.FramesController.DEFAULT_HTML_RESPONSE;
import static ua.sinaver.web3.payflow.service.TokenService.SUPPORTED_FRAME_PAYMENTS_CHAIN_IDS;

@RestController
@RequestMapping("/farcaster/frames/mint")
@Transactional
@Slf4j
public class MintController {
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

	private static Payment getMintPayment(ValidatedFrameResponseMessage validateMessage,
			User user,
			Integer receiverFid,
			String receiverAddress,
			Integer chainId,
			String token,
			String originalMintUrl) {
		val sourceApp = validateMessage.action().signer().client().displayName();
		val castHash = validateMessage.action().cast().hash();
		val sourceRef = String.format("https://warpcast.com/%s/%s",
				validateMessage.action().cast().author().username(), castHash.substring(0, 10));

		val payment = new Payment(Payment.PaymentType.INTENT, null, chainId, token);
		payment.setCategory("mint");
		payment.setToken(token);
		payment.setReceiverFid(receiverFid);
		payment.setReceiverAddress(receiverAddress);
		payment.setSender(user);
		payment.setSourceApp(sourceApp);
		payment.setSourceRef(sourceRef);
		payment.setSourceHash(castHash);
		payment.setTarget(originalMintUrl);
		return payment;
	}

	@PostMapping("/submit")
	public ResponseEntity<?> submit(@RequestBody FrameMessage frameMessage,
			@RequestParam String provider,
			@RequestParam Integer chainId,
			@RequestParam String contract,
			@RequestParam(required = false) String author,
			@RequestParam(required = false) Integer tokenId,
			@RequestParam(required = false) String referral) {

		log.debug("Received submit mint message request: {}", frameMessage);
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

		if (!SUPPORTED_FRAME_PAYMENTS_CHAIN_IDS.contains(chainId)) {
			log.error("Chain not supported for minting on payflow: {}", chainId);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage(String.format("`%s` chain not supported!", chainId)));
		}

		val token = String.format("%s:%s:%s:%s:%s", provider, contract,
				Optional.ofNullable(tokenId).map(String::valueOf).orElse(""),
				Optional.ofNullable(referral).orElse(""),
				Optional.ofNullable(author).orElse(""));

		val originalMintUrl = MintUrlUtils.calculateProviderMintUrl(
				provider, chainId, contract, tokenId, referral);

		val recipientTexts = Optional.ofNullable(validateMessage.action().input())
				.map(input -> input.text().trim())
				.filter(text -> !text.isEmpty())
				.map(text -> text.toLowerCase().replaceAll("@", ""))
				.map(text -> text.split("[,\\s]+"))
				.map(Arrays::asList)
				.orElse(Collections.singletonList(""));

		val payments = new ArrayList<Payment>();
		for (val recipientText : recipientTexts) {
			try {
				Integer receiverFid;
				String receiverAddress;
				if (StringUtils.isNotBlank(recipientText)) {
					val addresses = identityService.getFnameAddresses(recipientText);
					val identity = identityService.getHighestScoredIdentityInfo(addresses);
					if (identity == null) {
						log.error("Farcaster user identity not found: {}", recipientText);
						continue;
					}
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
						log.error("Farcaster user fid not found: {}", recipientText);
						continue;
					}
					receiverAddress = identity.address();
				} else {
					// Self-mint case
					receiverFid = interactor.fid();
					receiverAddress = clickedProfile.getIdentity();
				}

				val payment = getMintPayment(validateMessage, clickedProfile, receiverFid,
						receiverAddress, chainId, token, originalMintUrl);
				payments.add(payment);
				log.debug("Mint payment intent saved: {}", payment);
			} catch (Exception e) {
				log.error("Error processing recipient: {}", recipientText, e);
			}
		}

		if (payments.isEmpty()) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("No user found, try again"));
		}

		paymentRepository.saveAll(payments);
		log.debug("Mint payment intents saved: {}", payments);

		val miniAppRedirect = /*
								 * validateMessage.action().signer().client().username().equals("warpcast") &&
								 */
				MINIAPP_REDIRECT_ALLOWLIST.contains(interactor.username());
		val paymentLink = linkService.paymentLink(payments.getFirst(), miniAppRedirect);
		log.debug("Redirecting to {}", paymentLink);
		return ResponseEntity.status(HttpStatus.FOUND).location(paymentLink).build();
	}
}
