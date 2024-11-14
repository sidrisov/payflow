package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.StorageNotification;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.message.farcaster.StorageUsage;
import ua.sinaver.web3.payflow.repository.StorageNotificationRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@Transactional
@Slf4j
public class FarcasterStorageService {

	private static final int STORAGE_CAST_CAPACITY = 4000;
	private static final int STORAGE_REACTION_CAPACITY = 2000;
	private static final int STORAGE_LINK_CAPACITY = 2000;

	@Autowired
	private FarcasterMessagingService messagingService;

	@Autowired
	private FarcasterNeynarService neynarService;

	@Autowired
	private IdentityService identityService;

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
								val response = messagingService.sendMessage(new DirectCastMessage(
										fid.toString(),
										String.format(
												"""
														@%s, you're reaching or over your storage capacity!

														1 unit costs ~$2, you can purchase more with any token balance on @payflow 👇

														https://frames.payflow.me/fid/%s/storage

														To disable or configure storage notifications, visit:
														https://app.payflow.me/notifications
														""",
												username, fid),
										UUID.randomUUID()));

								if (response.result().success()) {
									storageNotification.setLastCheckedAt(Instant.now());
								}

								Thread.sleep(1000);
							} else {
								storageNotification.setLastCheckedAt(Instant.now());
							}
						}
					} catch (Throwable t) {
						log.error("Failed to check storage for {}", fid, t);
					}
				});

	}

}
