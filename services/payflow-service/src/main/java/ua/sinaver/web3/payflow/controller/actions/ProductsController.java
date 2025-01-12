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
import ua.sinaver.web3.payflow.message.moxie.FanToken;
import ua.sinaver.web3.payflow.message.nft.ParsedMintUrlMessage;
import ua.sinaver.web3.payflow.service.FanTokenService;
import ua.sinaver.web3.payflow.service.FarcasterNeynarService;
import ua.sinaver.web3.payflow.utils.FrameResponse;
import ua.sinaver.web3.payflow.utils.FrameVersions;
import ua.sinaver.web3.payflow.utils.MintUrlUtils;

import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Stream;


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
					new CastActionMeta.Action("post")),
			"hypersub", new CastActionMeta(
					"Subscribe", "clock",
					"Use this action to subscribe to hypersub of caster or channel",
					"https://app.payflow.me/actions",
					new CastActionMeta.Action("post")));
	@Autowired
	private FarcasterNeynarService neynarService;
	@Autowired
	private PayflowConfig payflowConfig;

	@Autowired
	private FanTokenService fanTokenService;

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
			case "hypersub" -> processHypersubAction(validateMessage.action());
			default -> ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Unsupported action"));
		};
	}

	private ResponseEntity<?> processStorageAction(ValidatedFrameResponseMessage.Action action) {
		val castAuthor = action.cast().author() != null ? action.cast().author()
				: neynarService.fetchFarcasterUser(action.cast().fid());
		val storageFrameUrl = UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
				.path("/fid/{fid}/storage?" + FrameVersions.STORAGE_VERSION)
				.buildAndExpand(castAuthor.fid())
				.toUriString();

		log.debug("Returning storage frame url: {}", storageFrameUrl);
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

		val chainId = MintUrlUtils.getChainId(parsedMintUrlMessage);
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

		val fanTokens = Stream.of(
				castAuthor.username(),
				Optional.ofNullable(action.cast().channel()).map(channel -> "/" + channel.id()).orElse(null),
				"network:farcaster")
				.filter(Objects::nonNull)
				.map(fanTokenService::getFanToken)
				.filter(Objects::nonNull)
				.toList();

		if (fanTokens.isEmpty()) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("No fan token found!"));
		}

		val fanTokenFrameUrl = UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
				.path("/fan")
				.queryParam("names", fanTokens.stream().map(FanToken::name).toArray())
				.build()
				.encode()
				.toUriString();

		log.debug("Returning fan token frame URL: {}", fanTokenFrameUrl);
		return ResponseEntity.ok().body(
				new FrameResponse.ActionFrame("frame", fanTokenFrameUrl));
	}

	private ResponseEntity<?> processHypersubAction(ValidatedFrameResponseMessage.Action action) {
		val castAuthorFid = action.cast().author() != null ? action.cast().author().fid() : action.cast().fid();

		val subscriptions = neynarService.subscriptionsCreated(castAuthorFid);

		if (subscriptions.isEmpty()) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("No hypersub found!"));
		}

		val fanTokenFrameUrl = UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
				.path("/hypersub")
				.queryParam("ids",
						subscriptions.stream().map(s -> s.chain() + ":" + s.contractAddress()).toArray())
				.build()
				.encode()
				.toUriString();

		log.debug("Returning hypersub frame URL: {}", fanTokenFrameUrl);

		return ResponseEntity.ok().body(
				new FrameResponse.ActionFrame("frame", fanTokenFrameUrl));
	}

	private String buildMintFrameUrl(ParsedMintUrlMessage parsedMintUrlMessage, Integer chainId) {
		return UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
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
