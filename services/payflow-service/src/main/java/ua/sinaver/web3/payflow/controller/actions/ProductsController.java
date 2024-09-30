package ua.sinaver.web3.payflow.controller.actions;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.message.farcaster.Cast;
import ua.sinaver.web3.payflow.message.farcaster.CastActionMeta;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.message.farcaster.ValidatedFrameResponseMessage;
import ua.sinaver.web3.payflow.message.nft.ParsedMintUrlMessage;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.util.ArrayList;
import java.util.Map;
import java.util.Objects;

import static ua.sinaver.web3.payflow.service.TokenService.PAYMENT_CHAIN_IDS;
import static ua.sinaver.web3.payflow.service.TokenService.SUPPORTED_FRAME_PAYMENTS_CHAIN_IDS;

@RestController
@RequestMapping("/farcaster/actions/products")
@Transactional
@Slf4j
public class ProductsController {
	private static final Map<String, CastActionMeta> ACTION_METADATA = Map.of(
			"storage", new CastActionMeta(
					"Buy Storage", "database",
					"Use this action to buy storage to any farcaster user via Payflow",
					"https://app.payflow.me/actions",
					new CastActionMeta.Action("post")),
			"mint", new CastActionMeta(
					"Mint", "north-star",
					"Use this action to submit mint intent for the first NFT appeared in the cast",
					"https://app.payflow.me/actions",
					new CastActionMeta.Action("post")),
			"fan", new CastActionMeta(
					"Buy Fan Token", "star",
					"Use this action to submit fan token intent for caster, channel, and farcaster network",
					"https://app.payflow.me/actions",
					new CastActionMeta.Action("post")));
	@Autowired
	private IFarcasterNeynarService neynarService;
	@Autowired
	private IIdentityService identityService;
	@Autowired
	private PayflowConfig payflowConfig;

	@GetMapping("/{action}")
	public ResponseEntity<CastActionMeta> getActionMetadata(@PathVariable String action) {
		log.debug("Received metadata request for cast action: {}", action);
		CastActionMeta metadata = ACTION_METADATA.get(action);
		if (metadata == null) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok(metadata);
	}

	@PostMapping("/{action}")
	public ResponseEntity<?> processAction(@PathVariable String action, @RequestBody FrameMessage castActionMessage) {
		log.debug("Received cast action: {} {}", action, castActionMessage);

		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				castActionMessage.trustedData().messageBytes(), "fan".equals(action));
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Cast action not verified!"));
		}

		log.debug("Validation frame message response {} received on url: {}", validateMessage,
				validateMessage.action().url());

		return switch (action) {
			case "storage" -> processStorageAction(validateMessage.action());
			case "mint" -> processMintAction(validateMessage.action().cast());
			case "fan" -> processFanTokenAction(validateMessage.action());
			default -> ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Unsupported action"));
		};
	}

	private ResponseEntity<?> processStorageAction(ValidatedFrameResponseMessage.Action action) {
		val castAuthor = action.cast().author() != null ? action.cast().author()
				: neynarService.fetchFarcasterUser(action.cast().fid());
		val storageFrameUrl = UriComponentsBuilder.fromHttpUrl(payflowConfig.getFramesServiceUrl())
				.path("/fid/{fid}/storage?v3.4")
				.buildAndExpand(castAuthor.fid())
				.toUriString();
		return ResponseEntity.ok().body(
				new FrameResponse.ActionFrame("frame", storageFrameUrl));
	}

	private ResponseEntity<?> processMintAction(Cast cast) {
		val embeds = cast.embeds()
				.stream().map(Cast.Embed::url).filter(Objects::nonNull).toList();

		log.debug("Potential collectible embeds: {}", embeds);
		ParsedMintUrlMessage parsedMintUrlMessage = null;
		for (val embed : embeds) {
			parsedMintUrlMessage = ParsedMintUrlMessage.parse(embed);
			if (parsedMintUrlMessage != null) {
				break;
			}
		}

		if (parsedMintUrlMessage == null) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("No supported collection found!"));
		}

		val chainId = getChainId(parsedMintUrlMessage);
		if (chainId == null) {
			log.error("Chain not supported for minting on payflow: {}", parsedMintUrlMessage);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage(String.format("Mints on `%s` not supported!",
							parsedMintUrlMessage.chain())));
		}

		val mintFrameUrl = buildMintFrameUrl(parsedMintUrlMessage, chainId);

		log.debug("Returning mintFrameUrl: {}", mintFrameUrl);
		return ResponseEntity.ok().body(
				new FrameResponse.ActionFrame("frame", mintFrameUrl));
	}

	private ResponseEntity<?> processFanTokenAction(ValidatedFrameResponseMessage.Action action) {
		val castAuthor = action.cast().author() != null ? action.cast().author()
				: neynarService.fetchFarcasterUser(action.cast().fid());
		val fanTokenIds = new ArrayList<>();
		fanTokenIds.add(castAuthor.username());
		// Add channel option if available
		if (action.cast().channel() != null) {
			fanTokenIds.add("channel:" + action.cast().channel().id());
		}
		// Always add network:farcaster option
		fanTokenIds.add("network:farcaster");

		// Construct the fan token frame URL
		val fanTokenFrameUrl = UriComponentsBuilder.fromHttpUrl(payflowConfig.getFramesServiceUrl())
				.path("/fan")
				.queryParam("ids", fanTokenIds.toArray())
				.build()
				.encode()
				.toUriString();

		log.debug("Returning fan token frame URL: {}", fanTokenFrameUrl);

		return ResponseEntity.ok().body(
				new FrameResponse.ActionFrame("frame", fanTokenFrameUrl));
	}

	private Integer getChainId(ParsedMintUrlMessage parsedMintUrlMessage) {
		try {
			val parsedChainId = Integer.parseInt(parsedMintUrlMessage.chain());
			if (SUPPORTED_FRAME_PAYMENTS_CHAIN_IDS.contains(parsedChainId)) {
				return parsedChainId;
			}
		} catch (NumberFormatException e) {
			return PAYMENT_CHAIN_IDS.get(parsedMintUrlMessage.chain());
		}
		return null;
	}

	private String buildMintFrameUrl(ParsedMintUrlMessage parsedMintUrlMessage, Integer chainId) {
		return UriComponentsBuilder.fromHttpUrl(payflowConfig.getFramesServiceUrl())
				.path("/mint?provider={provider}" +
						"&chainId={chainId}" +
						"&contract={contract}" +
						"&tokenId={tokenId}" +
						"&referral={referral}")
				.buildAndExpand(parsedMintUrlMessage.provider(),
						chainId,
						parsedMintUrlMessage.contract(),
						parsedMintUrlMessage.tokenId(),
						parsedMintUrlMessage.referral())
				.toUriString();
	}
}
