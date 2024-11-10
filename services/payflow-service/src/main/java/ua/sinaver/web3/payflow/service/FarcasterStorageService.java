package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;

import java.util.UUID;


@Service
@Transactional
@Slf4j
public class FarcasterStorageService {

	@Autowired
	private FarcasterMessagingService messagingService;

	@Autowired
	private FarcasterNeynarService neynarService;

	@Autowired
	private IdentityService identityService;

	@Autowired
	private PaymentRepository paymentRepository;

	//@Scheduled(cron = "0 25 15 * * SUN", zone = "UTC")
	void notifyWithStorageExpiring() {
		paymentRepository.findCompletedStoragePayments().map(Payment::getReceiverFid).distinct().forEach(
				fid -> {
					try {
						val storageUsage = neynarService.fetchStorageUsage(fid);
						val storageAllocations = neynarService.fetchStorageAllocations(fid);
						if (storageUsage != null && storageAllocations != null) {
							val storageUsageWithSoonExpireUnits = storageUsage.withSoonExpireUnits(storageAllocations);
							log.debug("Fetched storage usage & allocations for {}: {}", fid, storageUsageWithSoonExpireUnits);
							if (storageUsageWithSoonExpireUnits.casts().capacity() < storageUsageWithSoonExpireUnits.casts().used()
									|| storageUsageWithSoonExpireUnits.reactions().capacity() < storageUsageWithSoonExpireUnits
									.reactions().used()
									|| storageUsageWithSoonExpireUnits.links().capacity() < storageUsageWithSoonExpireUnits.links()
									.used()) {

								val username = identityService.getFidFname(fid);

								messagingService.sendMessage(new DirectCastMessage(fid.toString(), String.format("""
										@%s, you're over the farcaster storage capacity!

										1 unit costs ~$2, you can purchase more with any token balance on @payflow 👇

										https://frames.payflow.me/fid/%s/storage
										""", username, fid),
										UUID.randomUUID()));

								Thread.sleep(1000);
							}
						}
					} catch (Throwable t) {
						log.error("Failed to check storage for {}", fid, t);
					}
				});

	}

}
