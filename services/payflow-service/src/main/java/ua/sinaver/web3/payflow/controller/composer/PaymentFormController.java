package ua.sinaver.web3.payflow.controller.composer;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.util.Comparator;

@RestController
@RequestMapping("/farcaster/composer/payment")
@Transactional
@Slf4j
public class PaymentFormController {

	@Autowired
	private IFarcasterNeynarService neynarService;
	@Autowired
	private IIdentityService identityService;

	@PostMapping
	public ResponseEntity<?> form(@RequestBody FrameMessage composerActionMessage) {
		log.debug("Received composer action: payment form {}", composerActionMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				composerActionMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Cast action not verified!"));
		}

		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val interactor = validateMessage.action().interactor();

		// pay first with higher social score
		val paymentAddresses = identityService.getIdentitiesInfo(interactor.addressesWithoutCustodialIfAvailable())
				.stream().max(Comparator.comparingInt(IdentityMessage::score))
				.map(IdentityMessage::address).stream().toList();

		// check if profile exist
		val paymentProfile = identityService.getProfiles(paymentAddresses).stream().findFirst().orElse(null);
		if (paymentProfile == null) {
			log.warn("Caster fid {} is not on Payflow", interactor);
		}

		String paymentAddress;
		if (paymentProfile == null || (paymentProfile.getDefaultFlow() == null
				&& paymentProfile.getDefaultReceivingAddress() == null)) {
			if (!paymentAddresses.isEmpty()) {
				// return first associated address without custodial
				paymentAddress = paymentAddresses.size() > 1 ?
						paymentAddresses.stream()
								.filter(e -> !e.equals(interactor.custodyAddress()))
								.findFirst()
								.orElse(null) :
						paymentAddresses.getFirst();
			} else {
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("Identity not found!"));
			}
		} else {
			// return profile identity
			paymentAddress = paymentProfile.getIdentity();
		}

		return ResponseEntity.ok().body(new FrameResponse.ComposerActionForm(
				"form", "Payment Frame",
				String.format("https://app.payflow.me/composer?identity=%s&action=frame",
						paymentAddress)));
	}
}
