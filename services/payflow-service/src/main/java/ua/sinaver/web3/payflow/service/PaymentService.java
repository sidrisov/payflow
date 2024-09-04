package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.data.Wallet;
import ua.sinaver.web3.payflow.message.Token;
import ua.sinaver.web3.payflow.repository.PaymentRepository;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Slf4j
public class PaymentService {
	@Autowired
	private TokenService tokenService;

	@Autowired
	private PaymentRepository paymentRepository;

	@Autowired
	private IdentityService identityService;

	public static String formatNumberWithSuffix(String numberStr) {
		double number = Double.parseDouble(numberStr);
		if (number >= 1_000_000) {
			return String.format("%.1fm", number / 1_000_000);
		} else if (number >= 1_000) {
			return String.format("%.1fk", number / 1_000);
		} else if (number >= 1) {
			return String.format("%.0f", number);
		} else if (number > 0) {
			return String.format("%.4f", number);
		} else {
			return "0.0";
		}
	}

	public static String formatNumberWithSuffix(double number) {
		if (number >= 1_000_000) {
			return String.format("%.1fm", number / 1_000_000);
		} else if (number >= 1_000) {
			return String.format("%.1fk", number / 1_000);
		} else if (number >= 1) {
			return String.format("%.0f", number);
		} else if (number > 0) {
			return String.format("%.4f", number);
		} else {
			return "0.0";
		}
	}

	public List<String> getAllPaymentRecipients(User user) {
		val verifications = identityService.getIdentityAddresses(user.getIdentity()).stream()
				.map(String::toLowerCase).toList();

		return paymentRepository.findBySenderOrSenderAddressInAndStatusInAndTypeInOrderByCreatedDateDesc(
						user, verifications, List.of(Payment.PaymentStatus.COMPLETED),
						List.of(Payment.PaymentType.APP, Payment.PaymentType.INTENT,
								Payment.PaymentType.INTENT_TOP_REPLY,
								Payment.PaymentType.FRAME))
				.stream()
				.map(payment -> payment.getReceiver() != null ?
						payment.getReceiver().getIdentity() : payment.getReceiverAddress())
				.filter(Objects::nonNull)
				.map(String::toLowerCase)
				.toList();
	}

	public List<Token> parseCommandTokens(String text) {
		val tokens = tokenService.getTokens();
		val patternStr = String.format("\\b(?<token>%s)\\b",
				tokens.stream()
						.map(t -> Pattern.quote(t.id().toLowerCase()))
						.distinct()
						.collect(Collectors.joining("|")));
		val pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE);
		val matcher = pattern.matcher(text);
		val matchedToken = matcher.find() ? matcher.group("token").toLowerCase() : "usdc";
		return tokens.stream().filter(t -> t.id().toLowerCase().equals(matchedToken)).toList();
	}

	public List<String> parsePreferredTokens(String text) {
		val allTokenIds = tokenService.getTokens().stream().map(Token::id).distinct().toList();
		return Arrays.stream(text
						.replace(",", " ")  // Replace commas with spaces
						.replace("$", "")    // Remove any $ symbols
						.toLowerCase()       // Convert to lowercase
						.split("\\s+"))      // Split by spaces
				.filter(allTokenIds::contains).limit(5).toList();
	}

	public Double parseTokenAmount(String amountStr) {
		var multiplier = 1;
		if (amountStr.endsWith("k")) {
			multiplier = 1000;
		} else if (amountStr.endsWith("m")) {
			multiplier = 1000000;
		}

		return Double.parseDouble(
				amountStr.replace("k", "").replace("m", "")) * multiplier;
	}

	public String getPaymentReceiverAddress(Payment payment) {
		if (payment.getReceiver() != null) {
			String userReceiverAddress = getUserReceiverAddress(payment.getReceiver(), payment.getNetwork());
			if (userReceiverAddress != null) {
				return userReceiverAddress;
			}
		}
		return payment.getReceiverAddress();
	}

	public String getUserReceiverAddress(User user, Integer chainId) {
		return user.getDefaultFlow() != null ?
				user.getDefaultFlow().getWallets().stream()
						.filter(w -> w.getNetwork().equals(chainId))
						.findFirst()
						.map(Wallet::getAddress).orElse(null) : user.getDefaultReceivingAddress();
	}

	public String parseCommandChain(String text) {
		val patternStr = String.format("\\b(?<chain>%s)\\b",
				tokenService.getTokens().stream()
						.map(t -> {
							val chain = t.chain();
							return Pattern.quote(chain.equals(TokenService.DEGEN_CHAIN_NAME) ? "degen-l3" : chain);
						}).distinct()
						.collect(Collectors.joining("|")));

		val pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE);
		val matcher = pattern.matcher(text);
		if (matcher.find()) {
			var matched = matcher.group("chain").toLowerCase();
			if (matched.equals("degen-l3")) {
				matched = TokenService.DEGEN_CHAIN_NAME;
			}
			return matched.toLowerCase();
		}
		return TokenService.BASE_CHAIN_NAME;
	}

	@Scheduled(fixedRate = 4 * 60 * 60 * 1000) // Run every 4 hours
	@Transactional
	public void expireOldPayments() {
		log.info("Starting expiration of old payments");
		val oneMonthAgo = new Date(System.currentTimeMillis() - 30L * 24 * 60 * 60 * 1000);
		
		try (Stream<Payment> oldPayments = paymentRepository.findOldPendingPaymentsWithLock(Payment.PaymentStatus.PENDING, oneMonthAgo)) {
			val expiredPayments = oldPayments
				.peek(payment -> {
					payment.setStatus(Payment.PaymentStatus.EXPIRED);
					payment.setCompletedDate(new Date());
					log.debug("Expiring old payment: {}", payment.getId());
				})
				.toList();

			if (!expiredPayments.isEmpty()) {
				paymentRepository.saveAll(expiredPayments);
				log.info("Expired {} old payments", expiredPayments.size());
			} else {
				log.info("No old payments to expire");
			}
		}

		log.info("Finished expiration process");
	}
}
