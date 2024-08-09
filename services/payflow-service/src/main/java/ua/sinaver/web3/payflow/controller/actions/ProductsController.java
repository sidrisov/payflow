package ua.sinaver.web3.payflow.controller.actions;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.message.farcaster.Cast;
import ua.sinaver.web3.payflow.message.farcaster.CastActionMeta;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.message.nft.ParsedMintUrlMessage;
import ua.sinaver.web3.payflow.service.WalletService;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.util.Objects;

@RestController
@RequestMapping("/farcaster/actions/products")
@Transactional
@Slf4j
public class ProductsController {
	private final static CastActionMeta GIFT_STORAGE_CAST_ACTION_META = new CastActionMeta(
			"Buy Storage", "database",
			"Use this action to buy storage to any farcaster user via Payflow",
			"https://app.payflow.me/actions",
			new CastActionMeta.Action("post"));

	private final static CastActionMeta MINT_CAST_ACTION_META = new CastActionMeta(
			"Mint", "north-star",
			"Use this action to submit mint intent for the first NFT appeared in the cast",
			"https://app.payflow.me/actions",
			new CastActionMeta.Action("post"));

	@Autowired
	private IFarcasterNeynarService neynarService;

	@Autowired
	private IIdentityService identityService;

	@GetMapping("/storage")
	public CastActionMeta storageMetadata() {
		log.debug("Received metadata request for cast action: gift storage");
		return GIFT_STORAGE_CAST_ACTION_META;
	}

	@GetMapping("/mint")
	public CastActionMeta mintMetadata() {
		log.debug("Received metadata request for cast action: mint");
		return MINT_CAST_ACTION_META;
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

		val castAuthor = validateMessage.action().cast().author() != null ?
				validateMessage.action().cast().author() :
				neynarService.fetchFarcasterUser(validateMessage.action().cast().fid());
		val castInteractor = validateMessage.action().interactor();

		val clickedProfile = identityService.getProfiles(castInteractor.addressesWithoutCustodialIfAvailable())
				.stream().findFirst().orElse(null);
		if (clickedProfile == null) {
			log.error("Clicked fid {} is not on payflow", castInteractor);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Sign up on Payflow first!"));
		}

		return ResponseEntity.ok().body(
				new FrameResponse.ActionFrame("frame", String.format("https://frames.payflow" +
						".me/fid/%s/storage?v3", castAuthor.fid())));
	}

	@PostMapping("/mint")
	public ResponseEntity<?> mint(@RequestBody FrameMessage castActionMessage) {
		log.debug("Received cast action: mint {}", castActionMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				castActionMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Cast action not verified!"));
		}

		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val embeds = validateMessage.action().cast().embeds()
				.stream().map(Cast.Embed::url).filter(Objects::nonNull).toList();

		ParsedMintUrlMessage parsedMintUrlMessage = null;
		for (val embed : embeds) {
			parsedMintUrlMessage = ParsedMintUrlMessage.parse(embed);
			if (parsedMintUrlMessage != null) {
				break;
			}
		}

		return parsedMintUrlMessage != null ?
				ResponseEntity.ok().body(new FrameResponse.FrameMessage(
						String.format("Found mint: %s",
								WalletService.shortenWalletAddressLabel(
										parsedMintUrlMessage.contract())))) :
				ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("No mint found!"));
	}
}
