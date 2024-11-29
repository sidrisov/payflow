package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.StorageNotification;
import ua.sinaver.web3.payflow.message.farcaster.Cast;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.message.farcaster.StorageUsage;
import ua.sinaver.web3.payflow.repository.StorageNotificationRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;

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

	@Scheduled(cron = "* */10 * * * *")
	void notifyWithStorageExpiring() {
		storageNotificationRepository.findTop10StorageNotifications(Instant.now().minus(7, ChronoUnit.DAYS))
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
								val storageEmbed = String.format("https://frames.payflow" +
										".me/fid/%s/storage", fid);
								val response = messagingService.sendMessage(new DirectCastMessage(
										fid.toString(),
										String.format(
												"""
														@%s, you're reaching or over your storage capacity!

														1 unit costs ~$2, you can purchase more with any token balance on @payflow 👇

														%s

														To disable or configure storage notifications, visit:
														https://app.payflow.me/notifications
														""",
												username, storageEmbed),
										UUID.randomUUID()));

								if (StringUtils.isNotBlank(response.result().messageId())) {
									storageNotification.setLastCheckedAt(Instant.now());

									try {
										notificationService.reply(String.format(
														"""
																@%s, you're reaching or over your storage capacity!
																			
																1 unit costs ~$2, you can purchase more with any token balance on @payflow 👇
																			
																To disable or configure storage notifications, visit:
																https://app.payflow.me/notifications
																""",
														username), null,
												List.of(new Cast.Embed(storageEmbed)));
									} catch (Throwable t) {
										log.error("Failed to cast storage notification for {}",
												fid, t);
									}

								} else {
									// small hack to delay check by 1 day
									storageNotification.setLastCheckedAt(Instant.now().minus(6, ChronoUnit.DAYS));
								}

								Thread.sleep(1000);
							} else {
								storageNotification.setLastCheckedAt(Instant.now());
							}
						}
					} catch (Throwable t) {
						log.error("Failed to check storage for {}", fid, t);
						// small hack to delay check by 1 day
						storageNotification.setLastCheckedAt(Instant.now().minus(6, ChronoUnit.DAYS));
					}
				});
	}

	//@Scheduled(initialDelay = 30 * 1000, fixedDelay = Long.MAX_VALUE)
	//@SchedulerLock(name = "scheduleStorageNotification", lockAtLeastFor = "PT1M", lockAtMostFor
	// = "PT5M")
	void scheduleStorageNotification() {
		userRepository.findAll().forEach(user -> {
			if (user.isAllowed()) {
				log.info("Storage notification for {}", user.getIdentity());
				val fid = identityService.getIdentityFid(user.getIdentity());
				if (fid != null && storageNotificationRepository.findByFid(Integer.parseInt(fid)).isEmpty()) {
					storageNotificationRepository.save(new StorageNotification(Integer.parseInt(fid)));
				}
			}
		});
	}
}
