package ua.sinaver.web3.payflow.controller.actions;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.message.farcaster.CastActionMeta;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.util.Comparator;

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

	@GetMapping("/storage")
	public CastActionMeta storageMetadata() {
		log.debug("Received metadata request for cast action: gift storage");
		return GIFT_STORAGE_CAST_ACTION_META;
	}

	@PostMapping("/storage")
	public ResponseEntity<?> storage(@RequestBody FrameMessage castActionMessage) {
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

		val clickedProfile = identityService.getProfiles(castInteractor.addresses())
				.stream().findFirst().orElse(null);
		if (clickedProfile == null) {
			log.error("Clicked fid {} is not on payflow", castInteractor);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Sign up on Payflow first!"));
		}

		// pay first with higher social score
		val paymentAddresses = identityService.getIdentitiesInfo(castAuthor.addressesWithoutCustodialIfAvailable())
				.stream().max(Comparator.comparingInt(IdentityMessage::score))
				.map(IdentityMessage::address).stream().toList();

		// check if profile exist
		val paymentProfile = identityService.getProfiles(paymentAddresses).stream().findFirst().orElse(null);
		if (paymentProfile == null) {
			log.warn("Caster fid {} is not on Payflow", castAuthor);
		}

		String paymentAddress;
		if (paymentProfile == null || paymentProfile.getDefaultFlow() == null) {
			if (!paymentAddresses.isEmpty()) {
				// return first associated address without custodial
				paymentAddress = paymentAddresses.size() > 1 ?
						paymentAddresses.stream()
								.filter(e -> !e.equals(castAuthor.custodyAddress()))
								.findFirst()
								.orElse(null) :
						paymentAddresses.getFirst();
			} else {
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("Recipient address not found!"));
			}
		} else {
			// return profile identity
			paymentAddress = paymentProfile.getIdentity();
		}

		return ResponseEntity.ok().body(
				new FrameResponse.ActionFrame("frame", String.format("https://frames.payflow" +
						".me/%s/storage", paymentAddress)));
	}
}
