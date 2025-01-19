package ua.sinaver.web3.payflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.bot.PaymentBotJob;
import ua.sinaver.web3.payflow.message.farcaster.CastCreatedMessage;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterSignedMessage;
import ua.sinaver.web3.payflow.message.farcaster.modbot.MembershipRequestMessage;
import ua.sinaver.web3.payflow.message.farcaster.modbot.MembershipResponseMessage;
import ua.sinaver.web3.payflow.repository.PaymentBotJobRepository;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.FarcasterBotService;
import ua.sinaver.web3.payflow.service.FarcasterMessagingService;
import ua.sinaver.web3.payflow.service.IdentityService;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static ua.sinaver.web3.payflow.service.FarcasterBotService.BOT_FID;

@RestController
@RequestMapping("/farcaster/webhooks")
@Slf4j
public class WebhooksController {
	private static final Logger LOGGER = LoggerFactory.getLogger(WebhooksController.class);

	@Value("${payflow.farcaster.webhooks.neynar.secret}")
	private String neynarSecret;

	@Value("${payflow.farcaster.webhooks.membership.secret}")
	private String membershipSecret;

	@Autowired
	private PaymentBotJobRepository paymentBotJobRepository;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private IdentityService identityService;

	@Autowired
	private PaymentRepository paymentRepository;

	@Autowired
	private FarcasterMessagingService farcasterMessagingService;

	@Autowired
	private FarcasterBotService farcasterPaymentBotService;

	private static String bytesToHex(byte[] bytes) {
		StringBuilder hexString = new StringBuilder();
		for (byte b : bytes) {
			String hex = Integer.toHexString(0xff & b);
			if (hex.length() == 1) {
				hexString.append('0');
			}
			hexString.append(hex);
		}
		return hexString.toString();
	}

	@PostMapping("/frames/v2")
	public ResponseEntity<String> processFrameV2Message(
			@RequestBody FarcasterSignedMessage frameV2Message) {
		log.debug("Frame V2 Webhook Message: {}", frameV2Message);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/bot")
	public ResponseEntity<String> processBotCommand(
			@RequestHeader("X-Neynar-Signature") String signature,
			@RequestBody String rawBody) {

		if (StringUtils.isBlank(signature)) {
			LOGGER.error("No Signature found!");
			return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
		}

		log.debug("Incoming mention: rawCast: {}, signature: {}", rawBody,
				signature);

		CastCreatedMessage castCreatedMessage;
		try {
			castCreatedMessage = objectMapper.readValue(rawBody, CastCreatedMessage.class);
			log.debug("Parsed cast created message: {}", castCreatedMessage);
		} catch (Throwable t) {
			log.error("Failed to parse cast message", t);
			return ResponseEntity.badRequest().body("Failed to parse cast message!");
		}

		try {
			val isValid = verifySignature(rawBody, signature, neynarSecret);
			if (!isValid) {
				LOGGER.error("The provided signature is not valid");
				return ResponseEntity.badRequest().body("Invalid webhook signature");
			}

			val cast = castCreatedMessage.data();

			// save if not its cast and not quoted
			if (cast.author().fid() != BOT_FID ||
					(StringUtils.isNotBlank(cast.text()) &&
							!cast.text().matches("([\"'`])@payflow.*?\\1"))) {
				val job = new PaymentBotJob(cast.hash(),
						cast.author().fid(),
						Date.from(Instant.parse(cast.timestamp())),
						cast);

				// Save and flush to ensure persistence before async processing
				paymentBotJobRepository.saveAndFlush(job);
				farcasterPaymentBotService.asyncProcessBotJob(job.getId());
				LOGGER.info("Payment job command saved: {}", job);
			}

			return ResponseEntity.ok().body("Success");
		} catch (NoSuchAlgorithmException | InvalidKeyException e) {
			LOGGER.error("Security exception", e);
			return ResponseEntity.badRequest().body("Invalid webhook signature");
		}
	}

	@PostMapping("/membership")
	public ResponseEntity<?> membership(
			@RequestHeader("x-webhook-secret") String secret,
			@RequestParam(value = "minPayments", defaultValue = "5") Integer minNumberOfPayments,
			@RequestBody MembershipRequestMessage request) {

		if (!membershipSecret.equals(secret)) {
			log.debug("membership: {}", Thread.currentThread().getName());
			sendMembershipDeniedMessage(request.user().fid(), "Not authorized to access " +
					"membership API", minNumberOfPayments);
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(new MembershipResponseMessage("Not authorized to access membership API"));
		}

		val fid = request.user().fid();
		val verifications = request.user().verifications();
		val channelId = request.channel().id();

		if (!StringUtils.equals("payflow", channelId)) {
			log.error("Unsupported channelId: {}", channelId);
			return ResponseEntity.badRequest().body(new MembershipResponseMessage("Channel not supported"));
		}

		log.debug("Checking whether membership allowed for fid {} based on number of outbound completed payments", fid);

		if (verifications.isEmpty()) {
			log.error("No verifications for {}", fid);
			sendMembershipDeniedMessage(fid, "No verified address connected", minNumberOfPayments);
			return ResponseEntity.badRequest().body(new MembershipResponseMessage("No verified address connected"));
		}

		val users = identityService.getProfiles(verifications);
		if (users == null || users.isEmpty()) {
			log.error("Profile not found for {}", fid);
			sendMembershipDeniedMessage(fid, "Payflow profile not found", minNumberOfPayments);
			return ResponseEntity.badRequest().body(new MembershipResponseMessage("Payflow profile not found"));
		}

		val numberOfPayments = paymentRepository.findNumberOutboundCompleted(users, verifications);
		val isMembershipAllowed = numberOfPayments >= minNumberOfPayments;

		log.debug("Membership for fid {}: number of outbound completed - {} allowed - {}", fid, numberOfPayments,
				isMembershipAllowed);

		if (isMembershipAllowed) {
			log.info("Membership allowed for {}", fid);
			return ResponseEntity.ok(new MembershipResponseMessage(
					String.format("Membership allowed with %s >= %s payments", numberOfPayments,
							minNumberOfPayments)));
		} else {
			log.error("Membership not allowed for {}", fid);
			sendMembershipDeniedMessage(fid,
					String.format("Membership not allowed with %s < %s payments",
							numberOfPayments, minNumberOfPayments),
					minNumberOfPayments);
			return ResponseEntity.badRequest().body(new MembershipResponseMessage(
					String.format("Membership not allowed with %s < %s payments",
							numberOfPayments, minNumberOfPayments)));
		}
	}

	private boolean verifySignature(String body, String sig, String secret)
			throws NoSuchAlgorithmException, InvalidKeyException {
		val hmacSha512 = Mac.getInstance("HmacSHA512");
		val secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
		hmacSha512.init(secretKey);
		val hmac = hmacSha512.doFinal(body.getBytes(StandardCharsets.UTF_8));
		val generatedSignature = bytesToHex(hmac);
		return generatedSignature.equals(sig);
	}

	public void sendMembershipDeniedMessage(int fid, String reason, Integer minNumberOfPayments) {
		farcasterMessagingService.sendMessageAsync(new DirectCastMessage(String.valueOf(fid),
				String.format("""
						Thanks for requesting to join /payflow! 🙏

						Unfortunately, we couldn't approve your membership at this time.
						Reason: %s

						To join the channel, you need to:
						• Have at least one verified address
						• Sign up on app.payflow.me/connect
						• Make at least %s payments in social feed or in the app

						Keep using Payflow, and you'll be eligible soon! 💪

						Best regards,
						@sinaver""", reason, minNumberOfPayments), UUID.randomUUID()));
	}
}
