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
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.util.Comparator;

@RestController
@RequestMapping("/farcaster/actions/profile")
@Transactional
@Slf4j
public class PayController {

	private final static CastActionMeta PAY_PROFILE_CAST_ACTION_META = new CastActionMeta(
			"Pay", "zap",
			"Use this action to pay any farcaster user whether they're on Payflow or not with in-frame txs or submit payment intent to Payflow app",
			"https://app.payflow.me/actions",
			new CastActionMeta.Action("post"));

	@Autowired
	private IFarcasterNeynarService neynarService;
	@Autowired
	private IIdentityService identityService;

	@GetMapping
	public CastActionMeta metadata() {
		log.debug("Received metadata request for cast action: pay profile");
		return PAY_PROFILE_CAST_ACTION_META;
	}

	@PostMapping
	public ResponseEntity<?> create(@RequestBody FrameMessage castActionMessage) {
		log.debug("Received cast action: pay profile {}", castActionMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				castActionMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Cast action not verified!"));
		}

		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		// todo: temp hack
		val castAuthor = validateMessage.action().cast().author() != null ?
				validateMessage.action().cast().author() :
				neynarService.fetchFarcasterUser(validateMessage.action().cast().fid());


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
		if (paymentProfile == null || (paymentProfile.getDefaultFlow() == null
				&& paymentProfile.getDefaultReceivingAddress() == null)) {
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
						".me/%s", paymentAddress)));
	}
}
