package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.data.Wallet;
import ua.sinaver.web3.payflow.message.FramePaymentMessage;
import ua.sinaver.web3.payflow.message.Token;
import ua.sinaver.web3.payflow.message.glide.GlideSessionResponse;
import ua.sinaver.web3.payflow.repository.PaymentRepository;

import java.text.DecimalFormat;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
public class PaymentService {
	@Autowired
	NotificationService notificationService;
	@Autowired
	private TokenService tokenService;
	@Autowired
	private PaymentRepository paymentRepository;
	@Autowired
	private IdentityService identityService;
	@Autowired
	private PayWithGlideService payWithGlideService;
	@Autowired
	private WalletService walletService;
	@Autowired
	private TokenPriceService tokenPriceService;

	public static String formatNumberWithSuffix(String numberStr) {
		double number = Double.parseDouble(numberStr);
		if (number >= 1_000_000) {
			return String.format("%.1fm", number / 1_000_000);
		} else if (number >= 1_000) {
			return String.format("%.1fk", number / 1_000);
		} else if (number >= 1) {
			return String.format("%.0f", number);
		} else if (number > 0) {
			val df = new DecimalFormat("0.#####");
			df.setMinimumFractionDigits(1);
			return df.format(number);
		} else {
			return "0.0";
		}
	}

	public List<String> getAllPaymentRecipients(User user) {
		val verifications = identityService.getIdentityAddresses(user.getIdentity()).stream()
				.map(String::toLowerCase).toList();

		return paymentRepository.findBySenderOrSenderAddressInAndStatusInAndTypeInOrderByCreatedAtDesc(
						user, verifications, List.of(Payment.PaymentStatus.COMPLETED))
				.stream()
				.map(payment -> payment.getReceiver() != null ? payment.getReceiver().getIdentity()
						: payment.getReceiverAddress())
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
						.replace(",", " ") // Replace commas with spaces
						.replace("$", "") // Remove any $ symbols
						.toLowerCase() // Convert to lowercase
						.split("\\s+")) // Split by spaces
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
		if (payment.getReceiverAddress() != null) {
			return payment.getReceiverAddress();
		} else if (payment.getReceiver() != null) {
			return getUserReceiverAddress(payment.getReceiver(), payment.getNetwork());
		}
		return null;
	}

	public String getUserReceiverAddress(User user, Integer chainId) {
		return Optional.ofNullable(user.getDefaultFlow() != null ? user.getDefaultFlow().getWallets().stream()
				.filter(w -> w.getNetwork().equals(chainId))
				.findFirst()
				.map(Wallet::getAddress).orElse(null) : user.getDefaultReceivingAddress()).orElse(user.getIdentity());
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

	@Scheduled(fixedRate = 4 * 60 * 60 * 1000, initialDelay = 5 * 60 * 1000)
	// Run every 4 hours, with 5 minutes initial delay
	public void expireOldPayments() {
		log.info("Starting expiration of old payments");
		val oneMonthAgo = Instant.now().minus(7, ChronoUnit.DAYS);

		try (val oldPayments = paymentRepository
				.findExpiredPaymentsWithLock(Payment.PaymentStatus.CREATED, oneMonthAgo)) {
			val expiredPayments = oldPayments
					.peek(payment -> {
						payment.setStatus(Payment.PaymentStatus.EXPIRED);
						payment.setCompletedAt(Instant.now());
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

	@Scheduled(fixedRate = 15 * 60 * 1000, initialDelay = 15 * 1000)
	public void processInProgressPayments() {
		log.info("Starting to process in-progress and pending_refund payments");
		val paymentsToProcess = paymentRepository.findTop5ByStatusInWithLock(
				List.of(Payment.PaymentStatus.INPROGRESS, Payment.PaymentStatus.PENDING_REFUND));

		paymentsToProcess.forEach(payment -> {
			try {
				updatedPaymentFulfillmentStatus(payment);
			} catch (Exception e) {
				log.error("Error processing payment {}", payment.getReferenceId(), e);
			}
		});

		log.info("Finished processing in-progress and pending_refund payments");
	}

	@Transactional(Transactional.TxType.REQUIRES_NEW)
	public void updatedPaymentFulfillmentStatus(Payment payment) {
		log.debug("Processing payment: {}", payment.getReferenceId());
		try {
			val sessionResponse = payWithGlideService.getSessionInfo(payment.getFulfillmentId()).block();
			log.info("Glide response for refId: {} - {}", payment.getReferenceId(),
					sessionResponse);

			if (sessionResponse == null) {
				log.error("Session response is null for refId: {} & sessionId: {}", payment.getReferenceId(),
						payment.getFulfillmentId());
				payment.setStatus(Payment.PaymentStatus.FAILED);
				payment.setCompletedAt(Instant.now());
				return;
			}

			if (payment.getStatus().equals(Payment.PaymentStatus.INPROGRESS)) {
				if (GlideSessionResponse.TransactionStatus.SUCCESS
						.equals(sessionResponse.getSponsoredTransactionStatus())) {
					payment.setHash(sessionResponse.getSponsoredTransactionHash());
					payment.setStatus(Payment.PaymentStatus.COMPLETED);
					payment.setCompletedAt(Instant.now());
					if (payment.getFulfillmentHash() == null || payment.getFulfillmentChainId() == null) {
						payment.setFulfillmentHash(sessionResponse.getPaymentTransactionHash());
						payment.setFulfillmentChainId(
								Integer.parseInt(sessionResponse.getPaymentChainId().split("eip155:")[1]));
					}
					paymentRepository.save(payment);
					notificationService.notifyPaymentCompletion(payment, payment.getSender());

					log.info("Successfully updated payment as completed: {}",
							payment.getReferenceId());
				} else if (GlideSessionResponse.PaymentStatus.PENDING_REFUND
						.equals(sessionResponse.getPaymentStatus())) {
					payment.setStatus(Payment.PaymentStatus.PENDING_REFUND);
					paymentRepository.save(payment);
					// TODO: don't notify for now
					// notificationService.notifyPaymentCompletion(payment, payment.getSender());
				} else if (GlideSessionResponse.PaymentStatus.REFUNDED
						.equals(sessionResponse.getPaymentStatus())) {
					payment.setRefundHash(sessionResponse.getRefundTransactionHash());
					payment.setStatus(Payment.PaymentStatus.REFUNDED);
					payment.setCompletedAt(Instant.now());
					paymentRepository.save(payment);
					notificationService.notifyPaymentCompletion(payment, payment.getSender());

					log.info("Successfully updated payment as completed: {}",
							payment.getReferenceId());
				}
			} else if (payment.getStatus().equals(Payment.PaymentStatus.PENDING_REFUND)) {
				if (GlideSessionResponse.PaymentStatus.REFUNDED.equals(sessionResponse.getPaymentStatus())) {
					payment.setRefundHash(sessionResponse.getRefundTransactionHash());
					payment.setStatus(Payment.PaymentStatus.REFUNDED);
					payment.setCompletedAt(Instant.now());
					paymentRepository.save(payment);
					notificationService.notifyPaymentCompletion(payment, payment.getSender());

					log.info("Successfully updated payment as completed: {}",
							payment.getReferenceId());
				}
			}
		} catch (Exception e) {
			log.error("Error processing payment {}", payment.getReferenceId(), e);
			throw new RuntimeException("Failed to process payment", e);
		}
	}

	@Scheduled(fixedRate = 30 * 1000, initialDelay = 15 * 1000)
	// Every 30 seconds, with 15s initial delay
	public void processSessionIntentPayments() {
		log.info("Starting to process session intent payments");
		val paymentsToProcess = paymentRepository.findSessionIntentPaymentsWithLock(10);

		paymentsToProcess.forEach(payment -> {
			try {
				processSessionIntentPayment(payment);
			} catch (Exception e) {
				log.error("Error processing session intent payment {}", payment.getReferenceId(), e);
			}
		});

		log.info("Finished processing session intent payments");
	}

	@Async
	@Transactional(Transactional.TxType.REQUIRES_NEW)
	public void asyncProcessSessionIntentPayment(Integer paymentId) {
		val job = paymentRepository.findWithLockById(paymentId);
		job.ifPresent(this::processSessionIntentPayment);
	}

	@Transactional(Transactional.TxType.REQUIRES_NEW)
	public void processSessionIntentPayment(Payment payment) {
		log.debug("Processing session intent payment: {}", payment.getReferenceId());
		try {
			val response = walletService.processPayment(payment);
			if (response != null && response.status().equals("success")) {
				payment.setStatus(Payment.PaymentStatus.COMPLETED);
				payment.setCompletedAt(Instant.now());
				payment.setHash(response.txHash());
				log.debug("Processed session intent payment: {}", response);
				notificationService.notifyPaymentCompletion(payment, null);
			} else {
				payment.setStatus(Payment.PaymentStatus.FAILED);
				payment.recordFailure("failed to process payment");
			}
		} catch (Exception e) {
			payment.setStatus(Payment.PaymentStatus.FAILED);
			payment.recordFailure(e.getMessage());

			log.error("Error processing session intent payment {}", payment.getReferenceId(), e);
		}
	}

	public double getTokenAmount(FramePaymentMessage paymentMessage, TransactionService transactionService) {
		return paymentMessage.tokenAmount() != null ? paymentMessage.tokenAmount()
				: paymentMessage.usdAmount() / tokenPriceService.getPrices().get(paymentMessage.token());
	}

	public double getTokenAmount(Payment payment) {
		return StringUtils.isNotBlank(payment.getTokenAmount()) ?
				Double.parseDouble(payment.getTokenAmount())
				: Double.parseDouble(payment.getUsdAmount()) / tokenPriceService.getPrices().get(payment.getToken());
	}
}
