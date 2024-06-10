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
import ua.sinaver.web3.payflow.repository.PaymentBotJobRepository;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;

@RestController
@RequestMapping("/farcaster/webhooks")
@Slf4j
public class WebhooksController {
	private static final Logger LOGGER = LoggerFactory.getLogger(WebhooksController.class);

	@Value("${payflow.farcaster.webhooks.secret}")
	private String secret;

	@Autowired
	private PaymentBotJobRepository paymentBotJobRepository;

	@Autowired
	private ObjectMapper objectMapper;

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
			val isValid = verifySignature(rawBody, signature, secret);
			if (!isValid) {
				LOGGER.error("The provided signature is not valid");
				return ResponseEntity.badRequest().body("Invalid webhook signature");
			}

			val cast = castCreatedMessage.data();
			val job = new PaymentBotJob(cast.hash(),
					cast.author().fid(),
					Date.from(Instant.parse(cast.timestamp())),
					cast);

			paymentBotJobRepository.save(job);
			LOGGER.info("Payment job command saved: {}", job);
			return ResponseEntity.ok().body("Success");
		} catch (NoSuchAlgorithmException | InvalidKeyException e) {
			LOGGER.error("Security exception", e);
			return ResponseEntity.badRequest().body("Invalid webhook signature");
		}
	}

	private boolean verifySignature(String body, String sig, String secret) throws NoSuchAlgorithmException, InvalidKeyException {
		Mac hmacSha512 = Mac.getInstance("HmacSHA512");
		SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
		hmacSha512.init(secretKey);
		byte[] hmac = hmacSha512.doFinal(body.getBytes(StandardCharsets.UTF_8));
		String generatedSignature = bytesToHex(hmac);
		return generatedSignature.equals(sig);
	}
}
