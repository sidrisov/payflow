package ua.sinaver.web3.payflow.service;

import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.extern.log4j.Log4j2;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.TopCasterRewardSchedule;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.graphql.generated.types.FarcasterChannel;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.repository.TopCasterRewardScheduleRepository;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

import static ua.sinaver.web3.payflow.service.TokenService.BASE_CHAIN_ID;

@Log4j2
@Service
public class RewardsService {

	private final ScheduledExecutorService scheduler = Executors
			.newSingleThreadScheduledExecutor(Thread.ofVirtual().factory());
	@Autowired
	private FarcasterNeynarService neynarService;
	@Autowired
	private IdentityService identityService;
	@Autowired
	private PaymentRepository paymentRepository;
	@Autowired
	private IdentitySubscriptionsService subscriptionsService;
	@Autowired
	private FarcasterMessagingService farcasterMessagingService;
	@Autowired
	private LinkService linkService;
	@Autowired
	private EntityManager entityManager;

	@Autowired
	private AirstackSocialGraphService airstackSocialGraphService;

	@Autowired
	private TopCasterRewardScheduleRepository rewardScheduleRepository;

	public Payment createRewardPayment(User clickedProfile, int casterFid, String castHash,
	                                   String category,
	                                   Double usdAmount, Double tokenAmount, String token,
	                                   Integer chainId, String sourceApp,
	                                   String extraLink) {
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

		val payment = new Payment(Payment.PaymentType.INTENT, paymentProfile, chainId, token);
		payment.setCategory(category);
		payment.setReceiverAddress(paymentAddress);
		payment.setSender(clickedProfile);
		if (tokenAmount != null) {
			payment.setTokenAmount(tokenAmount.toString());
		} else {
			payment.setUsdAmount(usdAmount.toString());
		}
		payment.setSourceApp(sourceApp);
		payment.setSourceRef(sourceRef);
		payment.setSourceHash(castHash);
		payment.setTarget(extraLink);
		payment.setExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS));

		return payment;
	}

	@Async
	@Transactional(Transactional.TxType.REQUIRES_NEW)
	public void processTopCastRewards(
			String clickedFid,
			FarcasterChannel channel,
			String hypersubContractAddress,
			int numberOfRewards,
			User clickedProfile,
			Double amount, Double tokenAmount, String token, Integer chainId,
			String sourceApp,
			boolean isScheduled) {

		val excludeFids = new ArrayList<String>();
		excludeFids.add(String.valueOf(clickedFid));
		if (channel != null) {
			excludeFids.addAll(channel.getModeratorIds());
		}

		val channelId = channel != null ? channel.getChannelId() : null;

		val clickedProfileManaged = entityManager.merge(clickedProfile);
		val fidToPayment = fetchAndCreateTopCastPayments(
				excludeFids,
				channelId,
				hypersubContractAddress,
				numberOfRewards,
				clickedProfileManaged,
				amount, tokenAmount, token, chainId,
				sourceApp);

		if (fidToPayment.isEmpty()) {
			farcasterMessagingService.sendMessage(new DirectCastMessage(clickedFid,
					"❌ Failed to process Top Caster Rewards!", UUID.randomUUID()));
		} else {
			val payments = new ArrayList<>(fidToPayment.values());
			paymentRepository.saveAll(payments);

			// make sure payments are actually stored in db
			entityManager.flush();

			sendRewardMessages(clickedFid, channelId, payments, isScheduled);
		}

	}

	private void sendRewardMessages(String clickedFid, String channelId, List<Payment> payments,
	                                boolean isScheduled) {
		val message = String.format("""
						✅%s %s %d x %s Top Caster Rewards identified.
						Please, pay using the frame or the app:""",
				isScheduled ? " (Scheduler)" : "",
				channelId == null ? "Global" : "/" + channelId,
				payments.size(),
				StringUtils.isNotBlank(payments.getFirst().getTokenAmount())
						? PaymentService.formatNumberWithSuffix(payments.getFirst().getTokenAmount())
						: String.format("$%s", payments.getFirst().getUsdAmount()));

		scheduler.execute(() -> {
			farcasterMessagingService.sendMessage(new DirectCastMessage(
					clickedFid, message, UUID.randomUUID()));

			for (int i = 0; i < payments.size(); i++) {
				try {
					// 1 second delay between messages
					Thread.sleep(1500);
				} catch (InterruptedException e) {
					Thread.currentThread().interrupt();
					log.error("Thread was interrupted", e);
				}

				val topCastMessage = String.format("""
								Top Caster %d: %s
								""",
						i + 1, payments.get(i).getTarget());
				farcasterMessagingService.sendMessage(new DirectCastMessage(
						clickedFid, topCastMessage, UUID.randomUUID()));
				farcasterMessagingService.sendMessage(new DirectCastMessage(
						clickedFid, linkService.framePaymentLink(payments.get(i), true).toString(),
						UUID.randomUUID()));
			}
		});
	}

	private Map<Integer, Payment> fetchAndCreateTopCastPayments(List<String> excludedFids,
	                                                            String channelId,
	                                                            String subscriptionContract,
	                                                            int numberOfRewards,
	                                                            User clickedProfile,
	                                                            Double usdAmount, Double tokenAmount, String token, Integer chainId,
	                                                            String sourceApp) {
		val fidToPayment = new LinkedHashMap<Integer, Payment>();
		var cursor = (String) null;

		while (fidToPayment.size() < numberOfRewards) {
			val response = neynarService.fetchTrendingCasts(channelId, "7d",
					10, cursor);

			if (response == null || response.getCasts() == null || response.getCasts().isEmpty()) {
				break; // No more casts to process
			}

			for (val cast : response.getCasts()) {
				if (excludedFids.contains(String.valueOf(cast.author().fid()))
						|| fidToPayment.containsKey(cast.author().fid())) {
					continue;
				}

				if (subscriptionContract != null) {
					val verifications = cast.author().addressesWithoutCustodialIfAvailable();
					val subscribers = subscriptionsService.fetchHypersubSubscribers(BASE_CHAIN_ID, subscriptionContract,
							verifications);
					val validSubscription = subscribers.stream()
							.anyMatch(s -> Instant.now().isBefore(Instant.ofEpochSecond(s.purchaseExpiresAt()).plus(45, ChronoUnit.DAYS)) /*||
									Instant.now().isBefore(Instant.ofEpochSecond(s.expiresAt()).minus(*//*3 * 30*//*0, ChronoUnit.DAYS))*/);
					if (!validSubscription) {
						excludedFids.add(String.valueOf(cast.author().fid()));
						continue;
					}
				}

				try {
					val castLink = String.format("https://warpcast.com/%s/%s",
							cast.author().username(), cast.hash().substring(0, 10));
					val payment = createRewardPayment(clickedProfile, cast.author().fid(),
							cast.hash(), "reward_top_casters", usdAmount, tokenAmount, token, chainId,
							sourceApp, castLink);
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

	@Transactional
	@Scheduled(cron = "0 */5 * * * *")
	public void processSchedules() {
		log.debug("Processing reward schedules...");
		List<TopCasterRewardSchedule> schedules = rewardScheduleRepository
				.findTop10ByStatus(TopCasterRewardSchedule.ScheduleStatus.ACTIVE);

		val now = Instant.now();
		val schedulesToProcess = schedules.stream()
				.filter(s -> {
					try {
						// Skip if last attempt was less than 4 minutes ago (allowing for next 5-min check)
						if (s.getLastAttempt() != null && s.getLastAttempt().isAfter(
								now.minus(4, ChronoUnit.MINUTES))) {
							log.debug("Schedule {}: Skipping, last attempt too recent: {}", s.getId(), s.getLastAttempt());
							return false;
						}

						val cronExpression = CronExpression.parse(s.getCronExpression());
						val baseTime = s.getLastSuccess() != null ?
								s.getLastSuccess().atZone(ZoneOffset.UTC).toLocalDateTime() :
								// If never succeeded, look from the start of the current day
								now.atZone(ZoneOffset.UTC).toLocalDateTime().withHour(0).withMinute(0).withSecond(0);

						val nextExecution = cronExpression.next(baseTime);
						log.debug("Schedule {}: lastSuccess={}, baseTime={}, nextExecution={}, currentTime={}",
								s.getId(), s.getLastSuccess(), baseTime, nextExecution, now);

						return nextExecution != null &&
								nextExecution.atZone(ZoneOffset.UTC).toInstant().isBefore(now);
					} catch (IllegalArgumentException e) {
						log.error("Invalid cron expression for schedule {}: {}", s.getId(), e.getMessage());
						return false;
					}
				})
				.toList();

		log.info("Found {} schedules ready to process", schedulesToProcess.size());
		schedulesToProcess.forEach(this::processRewardSchedule);
	}

	@Transactional(Transactional.TxType.REQUIRES_NEW)
	public void processRewardSchedule(TopCasterRewardSchedule rewardSchedule) {
		try {
			val clickedFid = identityService.getIdentityFid(rewardSchedule.getUser().getIdentity());
			val hypersub = rewardSchedule.getCriteria() != null ?
					(String) rewardSchedule.getCriteria().get("hypersub") : null;

			val channelId = rewardSchedule.getChannelId();
			var channel = (FarcasterChannel) null;
			if (StringUtils.isNotBlank(channelId)) {
				channel = airstackSocialGraphService.getFarcasterChannelByChannelId(channelId);
				if (channel == null) {
					log.error("Failed to fetch channel: {}", channelId);
					rewardSchedule.recordFailure("Channel doesn't exist!");

				}
			}

			processTopCastRewards(
					clickedFid,
					channel,
					hypersub,
					rewardSchedule.getRewards(),
					rewardSchedule.getUser(),
					rewardSchedule.getUsdAmount(),
					rewardSchedule.getTokenAmount(),
					rewardSchedule.getToken(),
					rewardSchedule.getChainId(),
					"Warpcast",
					true
			);
			rewardSchedule.recordSuccess();
		} catch (Exception e) {
			log.error("Failed to process schedule {}", rewardSchedule.getId(), e);
			rewardSchedule.recordFailure(e.getMessage());
		}
	}
}
