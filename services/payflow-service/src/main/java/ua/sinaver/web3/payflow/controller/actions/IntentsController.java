package ua.sinaver.web3.payflow.controller.actions;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.graphql.generated.types.FarcasterChannel;
import ua.sinaver.web3.payflow.message.Token;
import ua.sinaver.web3.payflow.message.farcaster.CastActionMeta;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.*;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.text.DecimalFormat;

@RestController
@RequestMapping("/farcaster/actions/pay")
@Transactional
@Slf4j
public class IntentsController {

	@Autowired
	private FarcasterNeynarService neynarService;

	@Autowired
	private IdentityService identityService;

	@Autowired
	private PaymentRepository paymentRepository;

	@Autowired
	private TokenService tokenService;

	@Autowired
	private AirstackSocialGraphService airstackSocialGraphService;

	@Autowired
	private RewardsService rewardsService;

	@Autowired
	private LinkService linkService;

	public static String formatDouble(Double value) {
		val df = new DecimalFormat("#.#####");
		return df.format(value);
	}

	@GetMapping("/reward")
	public ResponseEntity<?> metadata(
			@RequestParam(name = "type", required = false) String type,
			@RequestParam(name = "amount", required = false, defaultValue = "1.0") Double amount,
			@RequestParam(name = "tokenAmount", required = false) Double tokenAmount,
			@RequestParam(name = "token", required = false, defaultValue = "degen") String token,
			@RequestParam(name = "chainId", required = false, defaultValue = "8453") Integer chainId,
			@RequestParam(name = "rewards", required = false, defaultValue = "1") Integer numberOfRewards,
			@RequestParam MultiValueMap<String, String> allParams) {

		log.debug("Received metadata request for cast action: pay intent with params: " +
				"type = {}, amount = {}, tokenAmount = {}, token = {}, chainId = {}, " +
				"numberOfRewards = {}, allParams = {}",
				type, amount, tokenAmount, token, chainId, numberOfRewards, allParams);

		CastActionMeta castActionMeta;

		String amountStr = tokenAmount != null ? formatDouble(tokenAmount) : String.format("$%s", formatDouble(amount));
		String tokenStr = StringUtils.upperCase(token);

		switch (type) {
			case "reward":
			default:
				String title = String.format("%s %s Cast Reward", amountStr, tokenStr);

				if (numberOfRewards > 1) {
					title = String.format("%s x%d", title, numberOfRewards);
				}

				String description = "Use this action to submit Cast Reward";

				if (!allParams.isEmpty()) {
					description += " with criteria: " + String.join(", ", allParams.keySet());
				}

				castActionMeta = new CastActionMeta(
						title,
						"gift",
						description,
						"https://app.payflow.me/actions",
						new CastActionMeta.Action("post"));
				break;
			case "reward_top_casters":
				castActionMeta = new CastActionMeta(
						String.format("%s x %s %s Top Caster Rewards", numberOfRewards, amountStr,
								tokenStr),
						"gift",
						"Use this action to submit Top Caster Rewards based on configured " +
								"user criteria",
						"https://app.payflow.me/actions",
						new CastActionMeta.Action("post"));
				break;
		}

		log.debug("Returning payment intent cast action meta: {}", castActionMeta);

		return ResponseEntity.ok(castActionMeta);
	}

	@PostMapping("/reward")
	public ResponseEntity<?> intent(
			@RequestBody FrameMessage castActionMessage,
			@RequestParam(name = "type", required = false) String type,
			@RequestParam(name = "amount", required = false, defaultValue = "1.0") Double amount,
			@RequestParam(name = "tokenAmount", required = false) Double tokenAmount,
			@RequestParam(name = "token", required = false, defaultValue = "degen") String token,
			@RequestParam(name = "chainId", required = false, defaultValue = "8453") Integer chainId,
			@RequestParam(name = "rewards", required = false, defaultValue = "1") Integer numberOfRewards,
			@RequestParam MultiValueMap<String, String> allParams) {

		log.debug("Received cast action: pay reward {} with params: type = {}, amount = {}, " +
				"tokenAmount = {}, token = {}, chainId = {}, numberOfRewards = {}, allParams = {}",
				castActionMessage, type, amount, tokenAmount, token, chainId, numberOfRewards, allParams);

		val validateMessage = neynarService.validaFrameRequest(
				castActionMessage.trustedData().messageBytes());
		if (validateMessage == null || !validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Cast action not verified!"));
		}

		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val supportedTokens = tokenService.getTokens().stream()
				.map(Token::id).toList();

		if (!supportedTokens.contains(token)) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Token not supported!"));
		}

		val clickedFid = validateMessage.action().interactor().fid();
		val clickedProfile = identityService.getProfilesByFid(clickedFid).stream().findFirst().orElse(null);
		if (clickedProfile == null) {
			log.error("Clicked fid {} is not on payflow", clickedFid);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Sign up on Payflow first!"));
		}

		val sourceApp = validateMessage.action().signer().client().displayName();

		switch (type) {
			case "reward_top_casters":
				val channelId = allParams.getFirst("channel");
				val hypersubContractAddress = allParams.getFirst("hypersub");

				var channel = (FarcasterChannel) null;
				if (StringUtils.isNotBlank(channelId)) {
					channel = airstackSocialGraphService.getFarcasterChannelByChannelId(channelId);
					if (channel == null) {
						log.error("Failed to fetch channel: {}", channelId);
						return ResponseEntity.badRequest().body(
								new FrameResponse.FrameMessage("Failed to fetch channel info!"));
					}
				}

				rewardsService.processTopCastRewards(
						String.valueOf(clickedFid),
						channel,
						hypersubContractAddress,
						numberOfRewards,
						clickedProfile,
						amount, tokenAmount, token, chainId,
						sourceApp,
						false);

				return ResponseEntity.ok().body(new FrameResponse.FrameMessage(String.format("""
						🔎 Identifying %s Top Casters, you'll receive notification!
						""", channelId == null ? "Global" : "/" + channelId)));

			case "reward":
			default:
				val author = validateMessage.action().cast().author();
				int authorFid = author != null
						? author.fid()
						: validateMessage.action().cast().fid();
				val authorCastHash = validateMessage.action().cast().hash();

				var castLink = (String) null;
				if (author != null) {
					castLink = String.format("https://warpcast.com/%s/%s",
							author.username(), authorCastHash.substring(0, 10));
				}
				val rewardPayment = rewardsService.createRewardPayment(clickedProfile, authorFid,
						authorCastHash,
						"reward",
						amount, tokenAmount, token, chainId, sourceApp, castLink);
				if (rewardPayment == null) {
					return ResponseEntity.badRequest().body(
							new FrameResponse.FrameMessage("Failed to create payment intent. Contact @sinaver.eth"));
				}
				paymentRepository.save(rewardPayment);
				log.debug("Reward intent saved: {}", rewardPayment);

				return ResponseEntity.ok().body(
						new FrameResponse.ActionFrame("frame",
								linkService.paymentLink(rewardPayment, false).toString()));
		}
	}
}
