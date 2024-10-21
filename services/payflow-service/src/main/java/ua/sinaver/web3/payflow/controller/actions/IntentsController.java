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
import ua.sinaver.web3.payflow.message.Token;
import ua.sinaver.web3.payflow.message.farcaster.CastActionMeta;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.AirstackSocialGraphService;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.PaymentService;
import ua.sinaver.web3.payflow.service.TokenService;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.text.DecimalFormat;
import java.util.List;

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
			@RequestParam(name = "numberOfRewards", required = false, defaultValue = "1") Integer numberOfRewards,
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
			@RequestParam(name = "numberOfRewards", required = false, defaultValue = "1") Integer numberOfRewards,
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

		int casterFid;
		String castHash;

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
				casterFid = Integer.parseInt(topReply.getFid());
				castHash = topReply.getHash();
				break;
			case REWARD_TOP_CASTERS:
				log.error("Unsupported reward type: {}", type);
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("Unsupported reward type!"));
			case REWARD:
			default:
				casterFid = validateMessage.action().cast().author() != null
						? validateMessage.action().cast().author().fid()
						: validateMessage.action().cast().fid();
				castHash = validateMessage.action().cast().hash();
				break;
		}

		val clickedProfile = identityService.getProfiles(clickedFid).stream().findFirst().orElse(null);
		if (clickedProfile == null) {
			log.error("Clicked fid {} is not on payflow", clickedFid);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Sign up on Payflow first!"));
		}

		// TODO: refactor in similar way it's done in PayController, so there's no need
		// to extra
		// addresses fetch, and used existing verifications returned in FarcasterUser
		// data
		// check if profile exist
		val paymentProfile = identityService.getProfiles(casterFid).stream().findFirst().orElse(null);
		String paymentAddress = null;
		if (paymentProfile == null || (paymentProfile.getDefaultFlow() == null
				&& paymentProfile.getDefaultReceivingAddress() == null)) {
			val paymentAddresses = identityService.getFidAddresses(casterFid);
			// pay first with higher social score now invite first
			paymentAddress = identityService.getHighestScoredIdentity(paymentAddresses);
			if (paymentAddress == null) {
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("Missing verified identity! Contact @sinaver.eth"));
			}
		}

		if (tokenAmount != null) {
			if (tokenAmount <= 0) {
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("Payment token amount should be more than 0"));
			}
		} else if (amount.isNaN() && amount <= 0 && amount >= 10) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Payment amount should be between $0-10"));
		}

		if (!SUPPORTED_FRAME_PAYMENTS_CHAIN_IDS.contains(chainId)) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Chain not supported"));
		}

		// check if profile accepts payment on the chain
		if (paymentProfile != null
				&& (paymentProfile.getDefaultFlow() != null || paymentProfile.getDefaultReceivingAddress() != null)) {
			val isWalletPresent = paymentService.getUserReceiverAddress(paymentProfile, chainId) != null;
			if (!isWalletPresent) {
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("Chain not accepted!"));
			}
		}

		val sourceApp = validateMessage.action().signer().client().displayName();
		val casterFcName = identityService.getFidFname(casterFid);
		// maybe would make sense to reference top cast instead (if it's a bot cast)
		val sourceRef = String.format("https://warpcast.com/%s/%s",
				casterFcName, castHash.substring(0,
						10));

		val payment = new Payment(type != null ? type : Payment.PaymentType.INTENT,
				paymentProfile,
				chainId, token);
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

		paymentRepository.save(payment);

		log.debug("Payment intent saved: {}", payment);

		val message = type != null && type.equals(Payment.PaymentType.INTENT_TOP_REPLY)
				? String.format("Submitted payment intent for top comment from @%s. " +
						"Pay in the app!", casterFcName)
				: String.format("Submitted payment intent for @%s. Pay in the app!", casterFcName);

		return ResponseEntity.ok().body(
				new FrameResponse.FrameMessage(message));
	}
}
