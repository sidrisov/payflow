package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.entity.StorageNotification;
import ua.sinaver.web3.payflow.message.farcaster.Cast;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.message.farcaster.StorageUsage;
import ua.sinaver.web3.payflow.repository.StorageNotificationRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.utils.FrameVersions;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@Slf4j
public class FarcasterStorageService {
	private static final int STORAGE_CAST_CAPACITY = 2000;
	private static final int STORAGE_REACTION_CAPACITY = 1000;
	private static final int STORAGE_LINK_CAPACITY = 1000;
	private static final String PARENT_CAST_HASH = "0x38a0051454e27004c6b3bdd182789c09d81f68d4";

	@Autowired
	private PayflowConfig payflowConfig;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private FarcasterMessagingService messagingService;
	@Autowired
	private FarcasterNeynarService neynarService;
	@Autowired
	private IdentityService identityService;
	@Autowired
	private NotificationService notificationService;
	@Autowired
	private StorageNotificationRepository storageNotificationRepository;

	private static boolean isShouldNotify(StorageNotification storageNotification,
	                                      StorageUsage storageUsageWithSoonExpireUnits) {
		val threshold = storageNotification.getThreshold() / 100.0;

		val remainingCasts = storageUsageWithSoonExpireUnits.casts().capacity() -
				storageUsageWithSoonExpireUnits.casts().used();
		if (storageNotification.getCapacityType() == StorageNotification.CapacityType.CASTS_ONLY) {
			return remainingCasts <= STORAGE_CAST_CAPACITY * threshold;
		} else {
			val remainingReactions = storageUsageWithSoonExpireUnits.reactions().capacity() -
					storageUsageWithSoonExpireUnits.reactions().used();
			val remainingLinks = storageUsageWithSoonExpireUnits.links().capacity() -
					storageUsageWithSoonExpireUnits.links().used();

			return remainingCasts <= STORAGE_CAST_CAPACITY * threshold ||
					remainingReactions <= STORAGE_REACTION_CAPACITY * threshold ||
					remainingLinks <= STORAGE_LINK_CAPACITY * threshold;
		}
	}

	@Scheduled(cron = "* */15 * * * *")
	void notifyWithStorageExpiring() {
		storageNotificationRepository.findTop10StorageNotifications(Instant.now().minus(7,
						ChronoUnit.DAYS))
				.forEach(storageNotification -> {
					val fid = storageNotification.getFid();
					try {
						val storageUsage = neynarService.fetchStorageUsage(fid);
						val storageAllocations = neynarService.fetchStorageAllocations(fid);
						if (storageUsage != null && storageAllocations != null) {
							val storageUsageWithSoonExpireUnits = storageUsage.withSoonExpireUnits(storageAllocations);
							log.debug("Fetched storage usage & allocations for {}: {}", fid,
									storageUsageWithSoonExpireUnits);

							boolean shouldNotify = isShouldNotify(storageNotification, storageUsageWithSoonExpireUnits);

							if (shouldNotify) {
								val username = identityService.getFidFname(fid);
								val storageFrameUrl = UriComponentsBuilder
										.fromHttpUrl(payflowConfig.getDAppServiceUrl())
										.path("/~/farcaster/storage?fid={fid}&{version}")
										.buildAndExpand(fid, FrameVersions.STORAGE_VERSION)
										.toUriString();

								// Send direct message if enabled
								if (storageNotification.isNotifyWithMessage()) {
									val response = messagingService.sendMessage(new DirectCastMessage(
											fid,
											String.format(
													"""
															@%s, you're reaching or over your farcaster storage capacity!
															
															1 unit costs ~$0.2, you can purchase more with any token balance on @payflow 👇
															
															%s
															
															You can also disable or change notification settings in the frame.
															""",
													username,
													storageFrameUrl),
											UUID.randomUUID()));

									if (StringUtils.isBlank(response.result().messageId())) {
										// small hack to delay check by 1 day if message failed
										storageNotification.setLastCheckedAt(Instant.now().minus(6, ChronoUnit.DAYS));
										return;
									}
								}

								// Send cast if enabled
								if (storageNotification.isNotifyWithCast()) {
									try {
										notificationService.reply(String.format(
														"""
																@%s, you're reaching or over your farcaster storage capacity!
																
																1 unit costs ~$0.2, you can purchase more with any token balance using @payflow 👇
																
																You can also disable or change notification settings in the frame.
																""",
														username), PARENT_CAST_HASH,
												List.of(new Cast.Embed(storageFrameUrl)));
									} catch (Throwable t) {
										log.error("Failed to cast storage notification for {}", fid, t);
									}
								}

								storageNotification.setLastCheckedAt(Instant.now());
								Thread.sleep(1000);
							} else {
								storageNotification.setLastCheckedAt(Instant.now());
							}
						} else {
							// delay check by 1 day
							storageNotification.setLastCheckedAt(Instant.now().minus(6, ChronoUnit.DAYS));
						}
					} catch (Throwable t) {
						log.error("Failed to check storage for {}", fid, t);
						// delay check by 1 day
						storageNotification.setLastCheckedAt(Instant.now().minus(6, ChronoUnit.DAYS));
					}
				});
	}

	@Scheduled(cron = "0 0 0 * * *")
	@SchedulerLock(name = "scheduleStorageNotification", lockAtLeastFor = "PT1M", lockAtMostFor = "PT5M")
	void scheduleStorageNotification() {
		val oneWeekAgo = Instant.now().minus(1, ChronoUnit.DAYS);
		userRepository.findByCreatedDateAfter(oneWeekAgo).forEach(user -> {
			if (user.isAllowed()) {
				log.info("Storage notification for {}", user.getIdentity());
				try {
					val fid = identityService.getIdentityFid(user.getIdentity());
					if (fid != null && storageNotificationRepository.findByFid(fid).isEmpty()) {
						storageNotificationRepository.save(new StorageNotification(fid));
					}
				} catch (Throwable t) {
					log.error("Failed to configure notification for {}", user.getIdentity(), t);
				}
			}
		});
	}
}
