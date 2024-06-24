package ua.sinaver.web3.payflow.controller.frames;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.message.farcaster.ValidatedFrameResponseMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import static ua.sinaver.web3.payflow.controller.frames.FramesController.DEFAULT_HTML_RESPONSE;
import static ua.sinaver.web3.payflow.service.TokenService.ETH_TOKEN;
import static ua.sinaver.web3.payflow.service.TokenService.OP_CHAIN_ID;

@RestController
@RequestMapping("/farcaster/frames/storage")
@Transactional
@Slf4j
public class StorageController {

	@Autowired
	private IFarcasterNeynarService neynarService;

	@Autowired
	private PaymentRepository paymentRepository;

	@Autowired
	private IIdentityService identityService;

	private static Payment getPayment(ValidatedFrameResponseMessage validateMessage,
	                                  FarcasterUser castAuthor, User clickedProfile,
	                                  int numberOfUnits) {
		val sourceApp = validateMessage.action().signer().client().displayName();
		val castHash = validateMessage.action().cast().hash();
		// maybe would make sense to reference top cast instead (if it's a bot cast)
		val sourceRef = String.format("https://warpcast.com/%s/%s",
				castAuthor.username(), castHash.substring(0,
						10));

		val payment = new Payment(Payment.PaymentType.INTENT,
				null, OP_CHAIN_ID, ETH_TOKEN);
		payment.setCategory("fc_storage");
		// use token amount as storage unit number
		payment.setTokenAmount(String.valueOf(numberOfUnits));
		payment.setReceiverFid(castAuthor.fid());
		payment.setSender(clickedProfile);
		payment.setSourceApp(sourceApp);
		payment.setSourceRef(sourceRef);
		payment.setSourceHash(castHash);
		return payment;
	}

	@PostMapping("/submit")
	public ResponseEntity<?> submit(@RequestBody FrameMessage frameMessage) {
		log.debug("Received submit gift storage message request: {}", frameMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val castAuthor = validateMessage.action().cast().author();
		val castInteractor = validateMessage.action().interactor();

		val clickedProfile = identityService.getProfiles(castInteractor.addresses())
				.stream().findFirst().orElse(null);
		if (clickedProfile == null) {
			log.error("Clicked fid {} is not on payflow", castInteractor);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Sign up on Payflow first!"));
		}

		val inputText = validateMessage.action().input() != null ?
				validateMessage.action().input().text().toLowerCase() : null;

		int numberOfUnits = 1;
		if (StringUtils.isNotBlank(inputText)) {
			try {
				numberOfUnits = Integer.parseInt(inputText);
			} catch (Throwable t) {
				log.warn("Couldn't parse input text of storage units {} by {}", inputText, castInteractor);
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("Enter units in numeric format, e.g. 1-5"));
			}
		}

		val payment = getPayment(validateMessage, castAuthor, clickedProfile, numberOfUnits);
		paymentRepository.save(payment);

		log.debug("Gift storage payment intent saved: {}", payment);

		return ResponseEntity.badRequest().body(
				new FrameResponse.FrameMessage(
						String.format("Gift storage intent for @%s submitted. Pay in the app!",
								castAuthor.username()))
		);
	}
}
