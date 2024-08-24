package ua.sinaver.web3.payflow.controller.actions;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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

import static ua.sinaver.web3.payflow.service.TokenService.PAYMENT_CHAIN_IDS;

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

	@GetMapping("/intent")
	public CastActionMeta metadata(
			@RequestParam(name = "type", required = false) Payment.PaymentType type,
			@RequestParam(name = "amount", required = false, defaultValue = "1.0") Double amount,
			@RequestParam(name = "tokenAmount", required = false) Double tokenAmount,
			@RequestParam(name = "token", required = false, defaultValue = "degen") String token,
			@RequestParam(name = "chain", required = false, defaultValue = "base") String chain) {
		log.debug("Received metadata request for cast action: pay intent with params: " +
						"type = {},  amount = {},  tokenAmount = {}, token = {}, chain = {}",
				type, amount, tokenAmount, token, chain);
		CastActionMeta castActionMeta;
		if (type != null && type.equals(Payment.PaymentType.INTENT_TOP_REPLY)) {
			castActionMeta = new CastActionMeta(
					String.format("%s %s (%s) Top Comment", tokenAmount != null ?
									formatDouble(tokenAmount) :
									String.format("$%s", formatDouble(amount)),
							StringUtils.upperCase(token), StringUtils.capitalize(chain)),
					"flame",
					"Use this action to submit payment intent to Payflow for cast's top comment " +
							"based on Airstack's Social Capital Value score",
					"https://payflow.me/actions",
					new CastActionMeta.Action("post"));
		} else {
			castActionMeta = new CastActionMeta(
					String.format("%s %s (%s)", tokenAmount != null ? formatDouble(tokenAmount) :
									String.format("$%s", formatDouble(amount)),
							StringUtils.upperCase(token), StringUtils.capitalize(chain)),
					"plus",
					"Use this action to submit payment intent to Payflow with pre-configured " +
							" amount of a token on specific chain",
					"https://app.payflow.me/actions",
					new CastActionMeta.Action("post"));
		}

		log.debug("Returning payment intent cast action meta: {}", castActionMeta);
		return castActionMeta;
	}

	@PostMapping("/intent")
	public ResponseEntity<FrameResponse.FrameMessage> intent(@RequestBody FrameMessage castActionMessage,
	                                                         @RequestParam(name = "type", required = false) Payment.PaymentType type,
	                                                         @RequestParam(name = "amount", required = false, defaultValue = "1.0") Double amount,
	                                                         @RequestParam(name = "tokenAmount", required = false) Double tokenAmount,
	                                                         @RequestParam(name = "token", required = false, defaultValue = "degen") String token,
	                                                         @RequestParam(name = "chain", required = false, defaultValue = "base") String chain) {
		log.debug("Received cast action: pay intent {}", castActionMessage);
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

		if (type != null && type.equals(Payment.PaymentType.INTENT_TOP_REPLY)) {
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
		} else {
			casterFid =
					validateMessage.action().cast().author() != null ?
							validateMessage.action().cast().author().fid() :
							validateMessage.action().cast().fid();
			castHash = validateMessage.action().cast().hash();
		}

		val clickedProfile = identityService.getProfiles(clickedFid).stream().findFirst().orElse(null);
		if (clickedProfile == null) {
			log.error("Clicked fid {} is not on payflow", clickedFid);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Sign up on Payflow first!"));
		}

		// TODO: refactor in similar way it's done in PayController, so there's no need to extra
		//  addresses fetch, and used existing verifications returned in FarcasterUser data
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

		val chainId = PAYMENT_CHAIN_IDS.get(chain);
		if (chainId == null) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Chain not supported"));
		}

		// check if profile accepts payment on the chain
		if (paymentProfile != null && (paymentProfile.getDefaultFlow() != null || paymentProfile.getDefaultReceivingAddress() != null)) {
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

		val message = type != null && type.equals(Payment.PaymentType.INTENT_TOP_REPLY) ?
				String.format("Submitted payment intent for top comment from @%s. " +
						"Pay in the app!", casterFcName) :
				String.format("Submitted payment intent for @%s. Pay in the app!", casterFcName);

		return ResponseEntity.ok().body(
				new FrameResponse.FrameMessage(message));
	}
}
