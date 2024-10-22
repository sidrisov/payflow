package ua.sinaver.web3.payflow.controller.actions;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.Token;
import ua.sinaver.web3.payflow.message.farcaster.CastActionMeta;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.*;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.text.DecimalFormat;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static ua.sinaver.web3.payflow.service.TokenService.*;

@RestController
@RequestMapping("/farcaster/actions/pay")
@Transactional
@Slf4j
public class IntentsController {

	@Autowired
	private IFarcasterNeynarService neynarService;

	@Autowired
	private IdentityService identityService;

	@Autowired
	private PaymentRepository paymentRepository;

	@Autowired
	private AirstackSocialGraphService socialGraphService;

	@Autowired
	private PaymentService paymentService;

	@Autowired
	private TokenService tokenService;

	@Autowired
	private IdentitySubscriptionsService subscriptionsService;

	@Autowired
	private AirstackSocialGraphService airstackSocialGraphService;

	public static String formatDouble(Double value) {
		val df = new DecimalFormat("#.#####");
		return df.format(value);
	}

	@GetMapping("/reward")
	public ResponseEntity<?> metadata(
			@RequestParam(name = "type", required = false) Payment.PaymentType type,
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

		val chain = PAYMENT_CHAIN_NAMES.getOrDefault(chainId, BASE_CHAIN_NAME);
		String amountStr = tokenAmount != null ? formatDouble(tokenAmount) : String.format("$%s", formatDouble(amount));
		String tokenStr = StringUtils.upperCase(token);
		String chainStr = StringUtils.capitalize(chain);

		switch (type) {
			case REWARD_TOP_REPLY:
				castActionMeta = new CastActionMeta(
						String.format("%s %s (%s) Top Comment", amountStr, tokenStr, chainStr),
						"flame",
						"Use this action to submit payment intent to Payflow for cast's top comment " +
								"based on Airstack's Social Capital Value score",
						"https://payflow.me/actions",
						new CastActionMeta.Action("post"));
				break;

			case REWARD:
			default:
				String title = String.format("%s %s (%s)", amountStr, tokenStr, chainStr);

				if (numberOfRewards > 1) {
					title = String.format("%s x%d", title, numberOfRewards);
				}

				String description = "Use this action to submit payment intent to Payflow with pre-configured " +
						"amount of a token on specific chain";

				if (!allParams.isEmpty()) {
					description += " with criteria: " + String.join(", ", allParams.keySet());
				}

				castActionMeta = new CastActionMeta(
						title,
						"plus",
						description,
						"https://app.payflow.me/actions",
						new CastActionMeta.Action("post"));
				break;
			case REWARD_TOP_CASTERS:
				castActionMeta = new CastActionMeta(
						String.format("%s %s x Top %s Casters", amountStr, tokenStr, numberOfRewards),
						"gift",
						"Use this action to submit rewards for the top casters based on " +
								"configured criteria",
						"https://app.payflow.me/actions",
						new CastActionMeta.Action("post"));
				break;
		}

		log.debug("Returning payment intent cast action meta: {}", castActionMeta);

		return ResponseEntity.ok(castActionMeta);
	}

	@PostMapping("/reward")
	public ResponseEntity<FrameResponse.FrameMessage> intent(
			@RequestBody FrameMessage castActionMessage,
			@RequestParam(name = "type", required = false) Payment.PaymentType type,
			@RequestParam(name = "amount", required = false, defaultValue = "1.0") Double amount,
			@RequestParam(name = "tokenAmount", required = false) Double tokenAmount,
			@RequestParam(name = "token", required = false, defaultValue = "degen") String token,
			@RequestParam(name = "chainId", required = false, defaultValue = "8453") Integer chainId,
			@RequestParam(name = "rewards", required = false, defaultValue = "1") Integer numberOfRewards,
			@RequestParam MultiValueMap<String, String> allParams) {

		log.debug("Received cast action: pay reward {} with params: type = {}, amount = {}, " +
						"tokenAmount = {}, token = {}, chainId = {}, numberOfRewards = {}, allParams = {}",
				castActionMessage, type, amount, tokenAmount, token, chainId, numberOfRewards, allParams);

		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				castActionMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
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
		val clickedProfile = identityService.getProfiles(clickedFid).stream().findFirst().orElse(null);
		if (clickedProfile == null) {
			log.error("Clicked fid {} is not on payflow", clickedFid);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Sign up on Payflow first!"));
		}

		val sourceApp = validateMessage.action().signer().client().displayName();

		switch (type) {
			case REWARD_TOP_REPLY:
				val parentHash = validateMessage.action().cast().hash();
				val topReply = socialGraphService.getTopCastReply(parentHash,
						List.of(String.valueOf(validateMessage.action().cast().author().fid()),
								String.valueOf(clickedFid)));
				if (topReply == null) {
					log.error("Failed to fetch top comment for: {}", parentHash);
					return ResponseEntity.badRequest().body(
							new FrameResponse.FrameMessage("Failed to identify top comment!"));
				}
				int casterFid = Integer.parseInt(topReply.getFid());
				val castHash = topReply.getHash();
				val payment = createRewardPayment(clickedProfile, casterFid, castHash, type,
						amount, tokenAmount, token, chainId, sourceApp);
				if (payment == null) {
					return ResponseEntity.badRequest().body(
							new FrameResponse.FrameMessage("Failed to create reward intent. " +
									"Contact @sinaver.eth"));
				}
				paymentRepository.save(payment);
				String casterFcName = identityService.getFidFname(casterFid);
				log.debug("Top reply reward intent saved: {}", payment);
				return ResponseEntity.ok().body(new FrameResponse.FrameMessage(
						String.format("Submitted reward for top comment from @%s. Pay in the app!",
								casterFcName)));

			case REWARD_TOP_CASTERS:
				val channelId = allParams.getFirst("channel");
				val hypersubContractAddress = allParams.getFirst("hypersub");

				var excludeFids = new ArrayList<String>();
				if (StringUtils.isNotBlank(channelId)) {
					val channel =
							airstackSocialGraphService.getFarcasterChannelByChannelId(channelId);
					if (channel == null) {
						log.error("Failed to fetch channel: {}", channelId);
						return ResponseEntity.badRequest().body(
								new FrameResponse.FrameMessage("Failed to fetch channel info!"));
					}

					excludeFids.addAll(channel.getModeratorIds());
				}
				excludeFids.add(String.valueOf(clickedFid));

				val fidToPayment = createUniquePayments(
						excludeFids,
						channelId,
						hypersubContractAddress,
						numberOfRewards,
						clickedProfile,
						amount, tokenAmount, token, chainId,
						sourceApp
				);

				if (fidToPayment.isEmpty()) {
					log.error("Failed to fetch trending casts");
					return ResponseEntity.badRequest().body(
							new FrameResponse.FrameMessage("Failed to find trending casts!"));
				}

				val payments = new ArrayList<>(fidToPayment.values());
				paymentRepository.saveAll(payments);
				log.debug("Trending casters reward intents saved: {}", payments);
				return ResponseEntity.ok().body(new FrameResponse.FrameMessage(
						String.format("Submitted rewards for top %d trending casters. Pay in the app!",
								payments.size())));

			case REWARD:
			default:
				int authorFid = validateMessage.action().cast().author() != null
						? validateMessage.action().cast().author().fid()
						: validateMessage.action().cast().fid();
				String authorCastHash = validateMessage.action().cast().hash();
				Payment rewardPayment = createRewardPayment(clickedProfile, authorFid, authorCastHash, type,
						amount, tokenAmount, token, chainId, sourceApp);
				if (rewardPayment == null) {
					return ResponseEntity.badRequest().body(
							new FrameResponse.FrameMessage("Failed to create payment intent. Contact @sinaver.eth"));
				}
				paymentRepository.save(rewardPayment);
				String authorFcName = identityService.getFidFname(authorFid);
				log.debug("Reward intent saved: {}", rewardPayment);
				return ResponseEntity.ok().body(new FrameResponse.FrameMessage(
						String.format("Submitted reward for @%s. Pay in the app!",
								authorFcName)));
		}
	}

	private Map<Integer, Payment> createUniquePayments(List<String> excludedFids,
	                                                   String channelId,
	                                                   String subscriptionContract,
	                                                   int numberOfRewards,
	                                                   User clickedProfile,
	                                                   Double amount, Double tokenAmount, String token, Integer chainId,
	                                                   String sourceApp) {
		val fidToPayment = new LinkedHashMap<Integer, Payment>();
		var cursor = (String) null;

		while (fidToPayment.size() < numberOfRewards) {
			val response = neynarService.fetchTrendingCasts(channelId, "7d",
					numberOfRewards - fidToPayment.size(), cursor);

			if (response == null || response.getCasts() == null || response.getCasts().isEmpty()) {
				break; // No more casts to process
			}

			for (val cast : response.getCasts()) {
				if (excludedFids.contains(String.valueOf(cast.fid())) || fidToPayment.containsKey(cast.author().fid())) {
					continue;
				}

				if (subscriptionContract != null) {
					val verifications = cast.author().verifications();
					val subscribers = subscriptionsService.fetchHypersubSubscribers(BASE_CHAIN_ID, subscriptionContract,
							verifications);
					val validSubscription = subscribers.stream()
							.anyMatch(s -> Instant.now().isBefore(Instant.ofEpochSecond(s.purchaseExpiresAt())));
					if (!validSubscription) {
						continue;
					}
				}

				try {
					val payment = createRewardPayment(clickedProfile, cast.author().fid(),
							cast.hash(), Payment.PaymentType.REWARD_TOP_CASTERS, amount, tokenAmount, token, chainId,
							sourceApp);
					if (payment != null) {
						fidToPayment.put(cast.author().fid(), payment);
						if (fidToPayment.size() == numberOfRewards) {
							return fidToPayment;
						}
					}
				} catch (Throwable t) {
					log.error("Failed to create a payment for cast: {} - error: {}", cast, t.getMessage());
				}
			}

			// Update cursor for next page
			cursor = response.getNext() != null ? response.getNext().getCursor() : null;
			if (cursor == null) {
				break; // No more pages to fetch
			}
		}

		return fidToPayment;
	}

	private Payment createRewardPayment(User clickedProfile, int casterFid, String castHash,
	                                    Payment.PaymentType type,
	                                    Double amount, Double tokenAmount, String token, Integer chainId, String sourceApp) {
		val paymentProfile = identityService.getProfiles(casterFid).stream().findFirst().orElse(null);
		String paymentAddress = null;
		if (paymentProfile == null || (paymentProfile.getDefaultFlow() == null
				&& paymentProfile.getDefaultReceivingAddress() == null)) {
			val paymentAddresses = identityService.getFidAddresses(casterFid);
			paymentAddress = identityService.getHighestScoredIdentity(paymentAddresses);
			if (paymentAddress == null) {
				log.error("Missing verified identity for caster FID: {}", casterFid);
				return null;
			}
		}

		val casterFcName = identityService.getFidFname(casterFid);
		val sourceRef = String.format("https://warpcast.com/%s/%s",
				casterFcName, castHash.substring(0, 10));

		val payment = new Payment(type, paymentProfile, chainId, token);
		payment.setReceiverAddress(paymentAddress);
		payment.setSender(clickedProfile);
		if (tokenAmount != null) {
			payment.setTokenAmount(tokenAmount.toString());
		} else {
			payment.setUsdAmount(amount.toString());
		}
		payment.setSourceApp(sourceApp);
		payment.setSourceRef(sourceRef);
		payment.setSourceHash(castHash);

		return payment;
	}
}
