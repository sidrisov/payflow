package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.bot.PaymentBotJob;
import ua.sinaver.web3.payflow.message.CastRequestMessage;
import ua.sinaver.web3.payflow.message.NotificationResponse;
import ua.sinaver.web3.payflow.repository.PaymentBotJobRepository;
import ua.sinaver.web3.payflow.service.api.IFrameService;

import java.util.Collections;
import java.util.Date;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@Transactional
@Slf4j
public class FarcasterPaymentBotService {

	private static final int PAYFLOW_FID = 211734;

	@Autowired
	private FarcasterHubService hubService;

	@Autowired
	private PaymentBotJobRepository paymentBotJobRepository;

	@Autowired
	private IFrameService frameService;

	@Value("${payflow.farcaster.bot.signer}")
	private String botSignerUuid;

	@Scheduled(fixedRate = 5 * 1000)
	void fetchBotMentions() {
		val latestPaymentJob = paymentBotJobRepository.findFirstByOrderByCastedDateDesc();
		val previousMostRecentTimestamp = latestPaymentJob
				.map(PaymentBotJob::getCastedDate)
				.orElse(new Date(System.currentTimeMillis() - TimeUnit.DAYS.toMillis(1)));

		String nextCursor = null;
		NotificationResponse response;
		val continueFetching = new AtomicBoolean(true);
		do {
			response = hubService.getFidNotifications(PAYFLOW_FID, nextCursor);
			nextCursor = response.next().cursor();
			val mentions = response.notifications().stream().filter(n -> n.type().equals("mention"))
					.toList();

			if (!mentions.isEmpty()) {
				val jobs = mentions.stream().filter(mention -> {
							if (mention.mostRecentTimestamp().after(previousMostRecentTimestamp)) {
								return true;
							} else {
								// ideally stop iterating once first occured
								continueFetching.set(false);
								return false;
							}
						}
				).map(mention ->
						new PaymentBotJob(mention.cast().hash(),
								mention.cast().author().fid(),
								mention.mostRecentTimestamp(),
								mention.cast())).toList();
				log.debug("Storing mentions - count {}", jobs);
				paymentBotJobRepository.saveAll(jobs);
			}
		} while (continueFetching.get() && nextCursor != null);
	}

	@Scheduled(fixedRate = 5 * 1000)
	void castBotMessage() {
		val mentions = paymentBotJobRepository.findTop10ByStatusOrderByCastedDateAsc(
				PaymentBotJob.Status.PENDING);

		mentions.forEach(mention -> {
			if (!mention.getCast().text().contains("@payflow bot receive")) {
				log.debug("Bot command not included in {}", mention);
				mention.setStatus(PaymentBotJob.Status.REJECTED);
				return;
			}

			val addresses = mention.getCast().author().verifications();
			// add custodial if not verified present
			if (addresses.isEmpty()) {
				addresses.add(mention.getCast().author().custodyAddress());
			}

			val profile = frameService.getFidProfiles(addresses)
					.stream().findFirst().orElse(null);
			if (profile == null) {
				log.error("Caster doesn't have payflow profile, " +
						"rejecting bot command - cast: {}", mention);
				mention.setStatus(PaymentBotJob.Status.REJECTED);
				return;
			}

			log.debug("Executing bot command for cast: {}", mention);
			val response = hubService.cast(botSignerUuid, null, mention.getCast().hash(),
					Collections.singletonList(
							new CastRequestMessage.Embed(
									String.format("https://frames.payflow.me/%s",
											profile.getUsername()))));
			if (response.success()) {
				log.debug("Successfully processed bot cast with reply: {}",
						response.cast());
				mention.setStatus(PaymentBotJob.Status.PROCESSED);
			}
		});
	}
}
