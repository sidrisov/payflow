package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.data.bot.PaymentBotJob;
import ua.sinaver.web3.payflow.message.CastEmbed;
import ua.sinaver.web3.payflow.message.NotificationResponse;
import ua.sinaver.web3.payflow.repository.PaymentBotJobRepository;
import ua.sinaver.web3.payflow.service.api.IFrameService;

import java.util.Collections;
import java.util.Date;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

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

	@Value("${payflow.farcaster.bot.enabled:false}")
	private boolean isBotEnabled;

	@Value("${payflow.farcaster.bot.cast.enabled:true}")
	private boolean isBotCastEnabled;

	@Value("${payflow.farcaster.bot.test.enabled:false}")
	private boolean isTestBotEnabled;

	@Scheduled(fixedRate = 5 * 1000)
	void fetchBotMentions() {
		if (!isBotEnabled) {
			return;
		}

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
								// ideally stop iterating once first occurred
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
		if (!isBotEnabled) {
			return;
		}

		val jobs = paymentBotJobRepository.findTop10ByStatusOrderByCastedDateAsc(
				PaymentBotJob.Status.PENDING);

		jobs.forEach(job -> {
			val cast = job.getCast();
			val botCommandPattern = String.format("\\s*(?<beforeText>.*?)?@payflow%s\\s+(?<command>\\w+)" +
							"(?:\\s+(?<remaining>.+))?",
					isTestBotEnabled ? "\\s+test" : "");

			var matcher = Pattern.compile(botCommandPattern, Pattern.DOTALL)
					.matcher(cast.text());
			if (matcher.find()) {
				val beforeText = matcher.group("beforeText");
				val command = matcher.group("command");
				val remainingText = matcher.group("remaining");
				log.debug("Bot command detected {} for {}, remaining {}", command, cast,
						remainingText);

				switch (command) {
					case "receive": {
						String token = null;
						String chain = null;

						if (!StringUtils.isBlank(remainingText)) {
							log.debug("Processing {} bot command arguments {}", command, remainingText);

							val receivePattern = "(?:on\\s+(?<chain>base|optimism))?" +
									"(?<token>eth|degen|usdc)?";
							matcher = Pattern.compile(receivePattern, Pattern.CASE_INSENSITIVE).matcher(remainingText);
							if (matcher.find()) {
								chain = matcher.group("chain");
								token = matcher.group("token");
							}
						}

						log.debug("Receiver: {}, token: {}, chain: {}",
								cast.author().username(),
								token, chain);

						val addresses = cast.author().verifications();
						// add custodial if not verified present
						if (addresses.isEmpty()) {
							addresses.add(cast.author().custodyAddress());
						}

						val profile = frameService.getFidProfiles(addresses)
								.stream().findFirst().orElse(null);
						if (profile == null) {
							log.error("Caster doesn't have payflow profile, " +
									"rejecting bot receive command for cast: {}", cast);
							job.setStatus(PaymentBotJob.Status.REJECTED);
							return;
						}

						log.debug("Executing bot receive command for cast: {}", cast);

						val castText = String.format("@%s receive funds with the frame",
								cast.author().username());
						val embeds = Collections.singletonList(
								new CastEmbed(
										String.format("https://frames.payflow.me/%s",
												profile.getUsername())));
						if (isBotCastEnabled) {
							val response = hubService.cast(botSignerUuid, castText, cast.hash(), embeds);
							if (response.success()) {
								log.debug("Successfully processed bot cast with reply: {}",
										response.cast());
								job.setStatus(PaymentBotJob.Status.PROCESSED);
								return;
							}
						} else {
							job.setStatus(PaymentBotJob.Status.PROCESSED);
						}
					}
					case "send": {
						String receiver = null;
						String token = null;
						String chain = null;

						User receiverProfile = null;
						if (!StringUtils.isBlank(remainingText)) {
							log.debug("Processing {} bot command arguments {}", command, remainingText);

							val sendPattern = "(?<=@)(?<receiver>[a-zA-Z0-9_.-]+)(?:\\s+)??" +
									"(?:on\\s+(?<chain>base|optimism))?" +
									"(?<token>eth|degen|usdc)?";
							matcher = Pattern.compile(sendPattern, Pattern.CASE_INSENSITIVE).matcher(remainingText);
							if (matcher.find()) {
								receiver = matcher.group("receiver");
								chain = matcher.group("chain");
								token = matcher.group("token");

								log.debug("Receiver: {}, token: {}, chain: {}", receiver, token, chain);

								// if receiver passed fetch meta from mentions
								if (!StringUtils.isBlank(receiver)) {
									String finalReceiver = receiver;
									val fcProfile = cast
											.mentionedProfiles().stream()
											.filter(p -> p.username().equals(finalReceiver)).findFirst().orElse(null);

									if (fcProfile == null) {
										log.error("Farcaster profile {} is not in the mentioned profiles list in {}",
												receiver, cast);
										job.setStatus(PaymentBotJob.Status.REJECTED);
										return;
									}

									val addresses = fcProfile.verifications();
									// add custodial if not verified present
									if (addresses.isEmpty()) {
										addresses.add(cast.author().custodyAddress());
									}
									receiverProfile = frameService.getFidProfiles(addresses)
											.stream().findFirst().orElse(null);
								}
							}
						}

						// if a reply, fetch through airstack
						if (StringUtils.isBlank(receiver) && cast.parentAuthor().fid() != null) {
							receiver = frameService.getFidFname(cast.parentAuthor().fid());
							receiverProfile = frameService.getFidProfiles(cast.parentAuthor().fid())
									.stream().findFirst().orElse(null);
						}

						log.debug("Receiver profile: {}", receiverProfile);

						if (receiverProfile != null) {
							val castText = String.format("@%s send funds to @%s with the frame",
									cast.author().username(),
									receiver);
							val embeds = Collections.singletonList(
									new CastEmbed(
											String.format("https://frames.payflow.me/%s",
													receiverProfile.getUsername())));

							if (isBotCastEnabled) {
								val response = hubService.cast(botSignerUuid, castText, cast.hash(), embeds);
								if (response.success()) {
									log.debug("Successfully processed bot cast with reply: {}",
											response.cast());
									job.setStatus(PaymentBotJob.Status.PROCESSED);
									return;
								}
							} else {
								job.setStatus(PaymentBotJob.Status.PROCESSED);
							}
						} else {
							log.error("Receiver should be specifier or it's optional if reply");
						}
					}
					case "jar": {
						if (!StringUtils.isBlank(remainingText)) {
							val jarTitlePattern = "\"(?<title>[^\"]*)\"";
							matcher = Pattern.compile(jarTitlePattern, Pattern.CASE_INSENSITIVE).matcher(remainingText);
							if (matcher.find()) {
								val jarTitle = matcher.group("title");
								if (!StringUtils.isBlank(jarTitle)) {
									val source = String.format("https://warpcast.com/%s/%s",
											cast.author().username(),
											cast.hash().substring(0, 10));
									log.debug("Executing jar creation with title `{}`, desc `{}`, " +
													"embeds {}, source {}",
											jarTitle, beforeText, cast.embeds(),
											source);
									job.setStatus(PaymentBotJob.Status.PROCESSED);
								} else {
									log.error("Empty title");
								}

							} else {
								log.error("Missing remaining text for title");
							}
						}
					}
					default: {
						log.error("Command not supported: {}", command);
					}
				}
			} else {
				log.error("Bot command not included in {}", cast);
			}

			job.setStatus(PaymentBotJob.Status.REJECTED);
		});
	}
}
