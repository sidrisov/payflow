package ua.sinaver.web3.payflow.service;

import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.PreferredTokens;
import ua.sinaver.web3.payflow.data.bot.PaymentBotJob;
import ua.sinaver.web3.payflow.message.Token;
import ua.sinaver.web3.payflow.message.farcaster.Cast;
import ua.sinaver.web3.payflow.repository.PaymentBotJobRepository;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.api.IFlowService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;

import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class FarcasterPaymentBotService {

	private static final List<String> SUPPORTED_COMMANDS = List.of("pay", "send", "intent",
			"batch", "intents", "jar", "receive", "config:tokens");
	@Autowired
	private PaymentBotJobRepository paymentBotJobRepository;
	@Autowired
	private IIdentityService identityService;
	@Autowired
	private IFlowService flowService;
	@Autowired
	private PaymentRepository paymentRepository;
	@Autowired
	private PaymentService paymentService;
	@Autowired
	private UserService userService;

	@Value("${payflow.farcaster.bot.enabled:false}")
	private boolean isBotEnabled;

	@Value("${payflow.farcaster.bot.test.enabled:false}")
	private boolean isTestBotEnabled;

	@Autowired
	private NotificationService notificationService;

	@Autowired
	private EntityManager entityManager;

	@Scheduled(fixedRate = 5 * 1000)
	void castBotMessage() {
		if (!isBotEnabled) {
			return;
		}

		val jobs = paymentBotJobRepository.findTop10ByStatusOrderByCastedDateAsc(
				PaymentBotJob.Status.PENDING);

		jobs.forEach(job -> {
			try {
				this.processBotJob(job);
			} catch (Throwable t) {
				log.error("Something went wrong: {} - {}", job.getId(), job.getCastHash(), t);
				job.setStatus(PaymentBotJob.Status.ERROR);
			}
		});
	}

	@Transactional(Transactional.TxType.REQUIRES_NEW)
	void processBotJob(PaymentBotJob job) {
		val cast = job.getCast();
		val supportedCommands = SUPPORTED_COMMANDS.stream()
				.map(Pattern::quote)
				.collect(Collectors.joining("|"));
		val botCommandPattern = String.format("\\s*(?<beforeText>.*?)?@payflow%s\\s+" +
				"(?<command>%s)" +
				"(?:\\s+(?<remaining>.+))?",
				isTestBotEnabled ? "\\s+test" : "",
				supportedCommands);

		var matcher = Pattern.compile(botCommandPattern, Pattern.DOTALL)
				.matcher(cast.text());
		if (matcher.find()) {
			val beforeText = matcher.group("beforeText");
			val command = matcher.group("command");
			val remainingText = matcher.group("remaining");
			log.debug("Bot command detected {} for {}, remaining {}", command, cast,
					remainingText);

			if (StringUtils.isBlank(remainingText)) {
				log.warn("No other text included after command: {} - {} in {} ", command,
						remainingText, cast);
				job.setStatus(PaymentBotJob.Status.REJECTED);
				return;
			}

			val casterProfile = userService.getOrCreateUserFromFarcasterProfile(cast.author(),
					false, false);
			val casterAddress = casterProfile != null ? casterProfile.getIdentity()
					: identityService.getHighestScoredIdentity(cast.author().addressesWithoutCustodialIfAvailable());

			switch (command) {
				case "receive": {
					String token = null;
					String chain = null;

					log.debug("Processing {} bot command arguments {}", command, remainingText);

					val receivePattern = "(?:on\\s+(?<chain>base|optimism))?" +
							"(?<token>eth|degen|usdc)?";
					matcher = Pattern.compile(receivePattern, Pattern.CASE_INSENSITIVE).matcher(remainingText);
					if (matcher.find()) {
						chain = matcher.group("chain");
						token = matcher.group("token");
					}

					log.debug("Receiver: {}, token: {}, chain: {}",
							cast.author().username(),
							token, chain);

					if (casterProfile == null) {
						log.error("Caster doesn't have payflow profile, " +
								"rejecting bot receive command for cast: {}", cast);
						job.setStatus(PaymentBotJob.Status.REJECTED);
						return;
					}

					log.debug("Executing bot receive command for cast: {}", cast);

					val castText = String.format("@%s receive funds with the frame",
							cast.author().username());
					val embeds = Collections.singletonList(
							new Cast.Embed(
									String.format("https://frames.payflow.me/%s",
											casterProfile.getUsername())));

					val processed = notificationService.reply(castText, cast.hash(), embeds);
					if (processed) {
						job.setStatus(PaymentBotJob.Status.PROCESSED);
						return;
					}
					break;
				}
				case "pay":
				case "intent":
				case "send": {
					log.debug("Processing {} bot command arguments {}", command, remainingText);

					val sendPattern = "(?:@(?<receiver>[a-zA-Z0-9_.-]+)\\s*)?\\s*(?<amount>\\$?[0-9]+(?:\\.[0-9]+)?[km]?)?\\s*(?<rest>.*)";
					matcher = Pattern.compile(sendPattern, Pattern.CASE_INSENSITIVE).matcher(remainingText);
					if (!matcher.find()) {
						log.warn("Pattern not matched for command: {} in {}", command, cast);
						job.setStatus(PaymentBotJob.Status.REJECTED);
						return;
					}

					String receiverName = matcher.group("receiver");
					String amountStr = matcher.group("amount");
					String restText = matcher.group("rest");
					Token token;

					val tokens = paymentService.parseCommandTokens(restText);
					if (tokens.size() == 1) {
						token = tokens.getFirst();
					} else {
						val chain = paymentService.parseCommandChain(restText);
						token = tokens.stream().filter(t -> t.chain().equals(chain)).findFirst().orElse(null);
					}

					if (token == null) {
						log.error("Token not supported {}", restText);
						job.setStatus(PaymentBotJob.Status.REJECTED);
						return;
					}

					log.debug("Receiver: {}, amount: {}, token: {}", receiverName, amountStr, token);

					List<String> receiverAddresses = null;
					// if receiver passed fetch meta from mentions
					if (!StringUtils.isBlank(receiverName)) {
						String finalReceiver = receiverName;
						val fcProfile = cast
								.mentionedProfiles().stream()
								.filter(p -> p.username().equals(finalReceiver)).findFirst().orElse(null);
						if (fcProfile == null) {
							log.error("Farcaster profile {} is not in the mentioned profiles list in {}",
									receiverName, cast);
							job.setStatus(PaymentBotJob.Status.REJECTED);
							return;
						}
						receiverAddresses = fcProfile.addressesWithoutCustodialIfAvailable();
					}

					// if a reply, fetch through airstack
					if (StringUtils.isBlank(receiverName)) {
						if (cast.parentAuthor().fid() != null) {
							receiverName = identityService.getFidFname(cast.parentAuthor().fid());
							receiverAddresses = identityService.getFidAddresses(cast.parentAuthor().fid());
						} else {
							val mentionedReceiver = cast.mentionedProfiles().stream()
									.filter(u -> !u.username().equals("payflow")).findFirst().orElse(null);
							if (mentionedReceiver != null) {
								receiverName = mentionedReceiver.username();
								receiverAddresses = mentionedReceiver.addressesWithoutCustodialIfAvailable();
							}
						}
					}

					log.debug("Receiver: {} - addresses: {}", receiverName, receiverAddresses);

					if (receiverName == null) {
						log.error("Receiver should be specifier or it's optional if reply");
						job.setStatus(PaymentBotJob.Status.REJECTED);
						return;
					}
					val receiverProfile = identityService.getProfiles(receiverAddresses)
							.stream().findFirst().orElse(null);
					log.debug("Found receiver profile for receiver {} - {}",
							receiverName, receiverProfile);

					String receiverAddress = null;

					if (receiverProfile != null) {
						receiverAddress = paymentService.getUserReceiverAddress(receiverProfile, token.chainId());
					}

					if (receiverAddress == null) {
						receiverAddress = identityService.getHighestScoredIdentity(receiverAddresses);
					}

					String refId = null;
					if (amountStr != null) {
						// TODO: hardcode for now, ask Neynar
						val sourceApp = "Warpcast";
						val sourceRef = String.format("https://warpcast.com/%s/%s",
								cast.author().username(),
								cast.hash().substring(0, 10));
						val sourceHash = cast.hash();
						val payment = new Payment((command.equals("send") || command.equals(
								"pay")) ? Payment.PaymentType.FRAME : Payment.PaymentType.INTENT,
								receiverProfile,
								token.chainId(), token.id());
						payment.setReceiverAddress(receiverAddress);
						payment.setSenderAddress(casterAddress);
						payment.setSender(casterProfile);
						if (amountStr.startsWith("$")) {
							payment.setUsdAmount(amountStr.replace("$", ""));
						} else {
							val tokenAmount = paymentService.parseTokenAmount(amountStr.toLowerCase());
							payment.setTokenAmount(tokenAmount.toString());
						}
						payment.setSourceApp(sourceApp);
						payment.setSourceRef(sourceRef);
						payment.setSourceHash(sourceHash);
						paymentRepository.save(payment);
						refId = payment.getReferenceId();
					}

					String castText;
					if (command.equals("send") || command.equals("pay")) {
						castText = String.format("@%s pay @%s with the frame",
								cast.author().username(),
								receiverName);
					} else {
						castText = String.format("@%s pay @%s in the app",
								cast.author().username(),
								receiverName);
					}

					val frameUrl = refId == null ? String.format("https://frames.payflow.me/%s",
							receiverProfile != null ? receiverProfile.getUsername() : receiverAddresses)
							: String.format("https://frames.payflow.me/payment/%s", refId);

					val embeds = Collections.singletonList(
							new Cast.Embed(frameUrl));

					val processed = notificationService.reply(castText, cast.hash(), embeds);
					if (processed) {
						job.setStatus(PaymentBotJob.Status.PROCESSED);
						return;
					}
					break;
				}
				case "batch":
				case "intents": {
					log.debug("Processing {} bot command arguments {}", command, remainingText);

					val batchPattern = "\\s*(?<amount>\\$?[0-9]+(?:\\.[0-9]+)?[km]?)?\\s*(?<rest>.*)";
					matcher = Pattern.compile(batchPattern, Pattern.CASE_INSENSITIVE).matcher(remainingText);
					if (!matcher.find()) {
						log.warn("Pattern not matched for command: {} in {}", command, cast);
						job.setStatus(PaymentBotJob.Status.REJECTED);
						return;
					}

					final String amountStr = matcher.group("amount");
					String restText = matcher.group("rest");

					Token token;
					val tokens = paymentService.parseCommandTokens(restText);
					if (tokens.size() == 1) {
						token = tokens.getFirst();
					} else {
						val chain = paymentService.parseCommandChain(restText);
						token = tokens.stream().filter(t -> t.chain().equals(chain)).findFirst().get();
					}

					val mentions = cast.mentionedProfiles().stream()
							.filter(u -> !u.username().equals("payflow")
									&& !u.username().equals("bountybot"))
							.distinct().toList();

					log.debug("Receivers: {}, amount: {}, token: {}",
							mentions, amountStr, token);

					if (mentions.isEmpty()) {
						log.error("At least one mention should be specifier in batch " +
								"command: {}", job);
						job.setStatus(PaymentBotJob.Status.REJECTED);
						return;
					}

					for (val mention : mentions) {
						try {
							val receiver = mention.username();
							val receiverAddresses = mention.addressesWithoutCustodialIfAvailable();

							val receiverProfile = identityService.getProfiles(receiverAddresses)
									.stream().findFirst().orElse(null);

							log.debug("Found receiver profile for receiver {} - {}", receiver, receiverProfile);

							String receiverAddress = null;
							if (receiverProfile != null) {
								receiverAddress = paymentService.getUserReceiverAddress(receiverProfile,
										token.chainId());
							}

							if (receiverAddress == null) {
								receiverAddress = identityService.getHighestScoredIdentity(receiverAddresses);
							}

							// TODO: hardcode for now, ask Neynar
							val sourceApp = "Warpcast";
							val sourceRef = String.format("https://warpcast.com/%s/%s",
									cast.author().username(),
									cast.hash().substring(0, 10));
							val sourceHash = cast.hash();
							// TODO: check if token available for chain
							val payment = new Payment(
									command.equals("batch") ? Payment.PaymentType.FRAME
											: Payment.PaymentType.INTENT,
									receiverProfile,
									token.chainId(), token.id());
							payment.setReceiverAddress(receiverAddress);
							payment.setSender(casterProfile);
							if (amountStr.startsWith("$")) {
								payment.setUsdAmount(amountStr.replace("$", ""));
							} else {
								val tokenAmount = paymentService.parseTokenAmount(amountStr.toLowerCase());
								payment.setTokenAmount(tokenAmount.toString());
							}
							payment.setSourceApp(sourceApp);
							payment.setSourceRef(sourceRef);
							payment.setSourceHash(sourceHash);
							paymentRepository.save(payment);
							entityManager.flush();

							String castText;
							if (command.equals("batch")) {
								castText = String.format("@%s pay @%s with the frame",
										cast.author().username(),
										receiver);
							} else {
								castText = String.format("@%s pay @%s in the app",
										cast.author().username(),
										receiver);
							}

							val frameUrl = String.format("https://frames.payflow.me/payment/%s",
									payment.getReferenceId());
							val embeds = Collections.singletonList(
									new Cast.Embed(frameUrl));
							val processed = notificationService.reply(castText, cast.hash(), embeds);
							if (processed) {
								log.debug("Payment batch reply sent for {}", receiver);
							}
						} catch (Throwable t) {
							log.error("Error in batch command processing: {}", job, t);
						}
					}
					job.setStatus(PaymentBotJob.Status.PROCESSED);
					break;
				}
				case "jar": {
					val jarTitlePattern = "\"(?<title>[^\"]*)\"";
					matcher = Pattern.compile(jarTitlePattern, Pattern.CASE_INSENSITIVE).matcher(remainingText);
					if (matcher.find()) {
						val title = matcher.group("title");
						val image = cast.embeds() != null ? cast.embeds().stream()
								.filter(embed -> embed != null && embed.url() != null && (embed.url().endsWith(
										".png") || embed.url().endsWith(".jpg")))
								.findFirst().map(Cast.Embed::url).orElse(null) : null;
						if (!StringUtils.isBlank(title)) {
							val source = String.format("https://warpcast.com/%s/%s",
									cast.author().username(),
									cast.hash().substring(0, 10));
							log.debug("Executing jar creation with title `{}`, desc `{}`, " +
									"embeds {}, source {}",
									title, beforeText, cast.embeds(),
									source);

							val addresses = cast.author().verifications();
							addresses.add(cast.author().custodyAddress());

							val profile = identityService.getProfiles(addresses)
									.stream().findFirst().orElse(null);
							if (profile == null) {
								log.error("Caster doesn't have payflow profile, " +
										"rejecting bot jar command for cast: {}", cast);
								job.setStatus(PaymentBotJob.Status.REJECTED);
								return;
							}

							val jar = flowService.createJar(title, beforeText,
									image, source, profile);
							log.debug("Jar created {}", jar);

							val castText = String.format("@%s receive jar contributions with the frame",
									cast.author().username());
							val embeds = Collections.singletonList(
									new Cast.Embed(String.format("https://frames.payflow" +
											".me/jar/%s",
											jar.getFlow().getUuid())));
							val processed = notificationService.reply(castText, cast.hash(), embeds);
							if (processed) {
								job.setStatus(PaymentBotJob.Status.PROCESSED);
								return;
							}
						} else {
							log.error("Empty title");
						}

					} else {
						log.error("Missing remaining text for title");
					}
					break;
				}
				case "config:tokens": {
					if (casterProfile != null) {
						val preferredTokensIds = paymentService.parsePreferredTokens(remainingText);
						var preferredTokens = casterProfile.getPreferredTokens();
						if (preferredTokens == null) {
							preferredTokens = new PreferredTokens();
							preferredTokens.setUser(casterProfile);
							casterProfile.setPreferredTokens(preferredTokens);
						}
						// TODO: preUpdate prePersist doesn't work
						preferredTokens.setTokens(String.join(",", preferredTokensIds));
						userService.saveUser(casterProfile);

						if (notificationService.preferredTokensReply(cast.hash(), cast.author(),
								preferredTokensIds)) {
							job.setStatus(PaymentBotJob.Status.PROCESSED);
							return;
						}
					}
					break;
				}

				default: {
					log.error("Command not supported: {}", command);
				}
			}
		} else {
			log.error("Bot command not included in {}", cast);
		}

		job.setStatus(PaymentBotJob.Status.REJECTED);
	}
}
