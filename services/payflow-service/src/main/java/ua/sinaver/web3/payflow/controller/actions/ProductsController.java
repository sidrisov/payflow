package ua.sinaver.web3.payflow.controller.actions;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.farcaster.CastActionMeta;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.message.farcaster.ValidatedFrameResponseMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import static ua.sinaver.web3.payflow.service.TokenService.ETH_TOKEN;
import static ua.sinaver.web3.payflow.service.TokenService.OP_CHAIN_ID;

@RestController
@RequestMapping("/farcaster/actions/products")
@Transactional
@Slf4j
public class ProductsController {
	private final static CastActionMeta GIFT_STORAGE_CAST_ACTION_META = new CastActionMeta(
			"Gift Storage", "database",
			"Use this action to gift a storage to farcaster user via Payflow",
			"https://app.payflow.me/actions",
			new CastActionMeta.Action("post"));

	@Autowired
	private IFarcasterNeynarService neynarService;

	@Autowired
	private IIdentityService identityService;

	@Autowired
	private PaymentRepository paymentRepository;

	private static Payment getPayment(ValidatedFrameResponseMessage validateMessage,
	                                  FarcasterUser castAuthor, User clickedProfile) {
		val sourceApp = validateMessage.action().signer().client().displayName();
		val castHash = validateMessage.action().cast().hash();
		// maybe would make sense to reference top cast instead (if it's a bot cast)
		val sourceRef = String.format("https://warpcast.com/%s/%s",
				castAuthor.username(), castHash.substring(0,
						10));

		val payment = new Payment(Payment.PaymentType.INTENT,
				null, OP_CHAIN_ID, ETH_TOKEN);
		payment.setCategory("fc_storage");
		payment.setReceiverFid(castAuthor.fid());
		payment.setSender(clickedProfile);
		payment.setSourceApp(sourceApp);
		payment.setSourceRef(sourceRef);
		payment.setSourceHash(castHash);
		return payment;
	}

	@GetMapping("/storage")
	public CastActionMeta storageActionMetadata() {
		log.debug("Received metadata request for cast action: gift storage");
		return GIFT_STORAGE_CAST_ACTION_META;
	}

	@PostMapping("/storage")
	public ResponseEntity<FrameResponse.FrameMessage> invite(@RequestBody FrameMessage castActionMessage) {
		log.debug("Received cast action: gift storage {}", castActionMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				castActionMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Cast action not verified!"));
		}

		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val castAuthor = validateMessage.action().cast().author();
		val castInteractor = validateMessage.action().interactor();

		val clickedProfile =
				identityService.getProfiles(castInteractor.addresses()).stream().findFirst().orElse(null);
		if (clickedProfile == null) {
			log.error("Clicked fid {} is not on payflow", castInteractor);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Sign up on Payflow first!"));
		}

		val payment = getPayment(validateMessage, castAuthor, clickedProfile);
		paymentRepository.save(payment);

		log.debug("Gift storage payment intent saved: {}", payment);

		return ResponseEntity.ok().body(
				new FrameResponse.FrameMessage(
						String.format("Gift storage intent for @%s submitted. Pay in the app!",
								castAuthor.username()))
		);
	}
}
