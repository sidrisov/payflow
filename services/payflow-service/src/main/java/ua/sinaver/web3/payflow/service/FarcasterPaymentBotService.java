package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.Wallet;
import ua.sinaver.web3.payflow.data.bot.PaymentBotJob;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.message.Token;
import ua.sinaver.web3.payflow.message.farcaster.Cast;
import ua.sinaver.web3.payflow.repository.PaymentBotJobRepository;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.api.IFlowService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class FarcasterPaymentBotService {

	private static final List<String> SUPPORTED_COMMANDS = List.of("send", "intent",
			"batch", "intents", "jar", "receive");
	@Autowired
	private FarcasterNeynarService hubService;
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
	@Value("${payflow.farcaster.bot.cast.signer}")
	private String botSignerUuid;
	@Value("${payflow.farcaster.bot.enabled:false}")
	private boolean isBotEnabled;
	@Value("${payflow.farcaster.bot.reply.enabled:true}")
	private boolean isBotReplyEnabled;
	@Value("${payflow.farcaster.bot.test.enabled:false}")
	private boolean isTestBotEnabled;

	public boolean reply(String text, String parentHash, List<Cast.Embed> embeds) {
		if (isBotReplyEnabled) {
			var response = hubService.cast(botSignerUuid, text, parentHash, embeds);
			if (response != null && response.success()) {
				log.debug("Successfully processed bot cast with reply: {}",
						response.cast());
				return true;
			} else {
				response = hubService.cast(botSignerUuid, text, null, embeds);
				if (response != null && response.success()) {
					log.debug("Successfully processed bot cast without reply: {}",
							response.cast());
					return true;
				}
			}
		} else {
			log.debug("Bot reply disabled, skipping casting the reply");
			return true;
		}

		return false;
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

				val casterAddresses = cast.author().verifications();
				casterAddresses.add(cast.author().custodyAddress());

				val casterProfile = identityService.getProfiles(casterAddresses)
						.stream().findFirst().orElse(null);

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

						val processed = reply(castText, cast.hash(), embeds);
						if (processed) {
							job.setStatus(PaymentBotJob.Status.PROCESSED);
							return;
						}
					}
					case "intent":
					case "send": {
						String receiver = null;
						String amountStr = null;
						String restText;
						Token token = null;

						List<String> receiverAddresses = null;
						if (!StringUtils.isBlank(remainingText)) {
							log.debug("Processing {} bot command arguments {}", command, remainingText);

							val sendPattern = "(?:@(?<receiver>[a-zA-Z0-9_.-]+)\\s*)?\\s*(?<amount>\\$?[0-9]+(?:\\.[0-9]+)?[km]?)?\\s*(?<rest>.*)";
							matcher = Pattern.compile(sendPattern, Pattern.CASE_INSENSITIVE).matcher(remainingText);
							if (matcher.find()) {
								receiver = matcher.group("receiver");
								amountStr = matcher.group("amount");
								restText = matcher.group("rest");

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


								log.debug("Receiver: {}, amount: {}, token: {}", receiver, amountStr, token);

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

									receiverAddresses = fcProfile.addresses();
								}
							}
						}

						// if a reply, fetch through airstack
						if (StringUtils.isBlank(receiver)) {
							if (cast.parentAuthor().fid() != null) {
								receiver = identityService.getFidFname(cast.parentAuthor().fid());
								receiverAddresses = identityService.getFidAddresses(cast.parentAuthor().fid());
							} else {
								val mentionedReceiver = cast.mentionedProfiles().stream()
										.filter(u -> !u.username().equals("payflow")).findFirst().orElse(null);
								if (mentionedReceiver != null) {
									receiver = mentionedReceiver.username();
									receiverAddresses = mentionedReceiver.addresses();
								}
							}
						}

						log.debug("Receiver: {} - addresses: {}", receiver, receiverAddresses);

						if (receiver != null) {
							val receiverProfile = identityService.getProfiles(receiverAddresses)
									.stream().findFirst().orElse(null);

							log.debug("Found receiver profile for receiver {} - {}",
									receiver, receiverProfile);

							String receiverAddress = null;


							if (receiverProfile != null && receiverProfile.getDefaultFlow() != null) {
								val chainId = token.chainId();
								receiverAddress = receiverProfile.getDefaultFlow().getWallets().stream()
										.filter(w -> w.getNetwork().equals(chainId))
										.findFirst()
										.map(Wallet::getAddress).orElse(null);
							}

							if (receiverAddress == null) {
								val identity = identityService.getIdentitiesInfo(receiverAddresses)
										.stream().max(Comparator.comparingInt(IdentityMessage::score)).orElse(null);
								if (identity != null) {
									receiverAddress = identity.address();
								}
							}

							String refId = null;
							if (amountStr != null) {
								// TODO: hardcode for now, ask Neynar
								val sourceApp = "Warpcast";
								val sourceRef = String.format("https://warpcast.com/%s/%s",
										cast.author().username(),
										cast.hash().substring(0, 10));
								val sourceHash = cast.hash();
								val payment = new Payment(command.equals("send") ?
										Payment.PaymentType.FRAME : Payment.PaymentType.INTENT,
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
								refId = payment.getReferenceId();
							}

							String castText;
							if (command.equals("send")) {
								castText = String.format("@%s send funds to @%s with the frame",
										cast.author().username(),
										receiver);
							} else {
								castText = String.format("@%s send funds to @%s in the app",
										cast.author().username(),
										receiver);
							}

							val frameUrl = refId == null ?
									String.format("https://frames.payflow.me/%s",
											receiverProfile != null ?
													receiverProfile.getUsername() : receiverAddresses) :
									String.format("https://frames.payflow.me/payment/%s", refId);

							val embeds = Collections.singletonList(
									new Cast.Embed(frameUrl));

							val processed = reply(castText, cast.hash(), embeds);
							if (processed) {
								job.setStatus(PaymentBotJob.Status.PROCESSED);
								return;
							}
						} else {
							log.error("Receiver should be specifier or it's optional if reply");
						}
					}
					case "batch":
					case "intents": {
						if (!StringUtils.isBlank(remainingText)) {
							log.debug("Processing {} bot command arguments {}", command, remainingText);

							val batchPattern = "\\s*(?<amount>\\$?[0-9]+(?:\\.[0-9]+)?[km]?)?\\s*(?<rest>.*)";
							matcher = Pattern.compile(batchPattern, Pattern.CASE_INSENSITIVE).matcher(remainingText);
							if (matcher.find()) {
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
										.filter(u ->
												!u.username().equals("payflow")
														&& !u.username().equals("bountybot")
										).distinct().toList();

								log.debug("Receivers: {}, amount: {}, token: {}",
										mentions, amountStr, token);

								if (mentions.isEmpty()) {
									log.error("At least one mention should be specifier in batch " +
											"command: {}", job);
									return;
								}

								for (val mention : mentions) {
									try {
										val receiver = mention.username();
										val receiverAddresses = mention.addresses();

										val receiverProfile = identityService.getProfiles(receiverAddresses)
												.stream().findFirst().orElse(null);

										log.debug("Found receiver profile for receiver {} - {}", receiver, receiverProfile);

										String receiverAddress = null;
										if (receiverProfile != null && receiverProfile.getDefaultFlow() != null) {
											val chainId = token.chainId();
											receiverAddress = receiverProfile.getDefaultFlow().getWallets().stream()
													.filter(w -> w.getNetwork().equals(chainId))
													.findFirst()
													.map(Wallet::getAddress).orElse(null);
										}

										if (receiverAddress == null) {
											val identity = identityService.getIdentitiesInfo(receiverAddresses)
													.stream().max(Comparator.comparingInt(IdentityMessage::score)).orElse(null);
											if (identity != null) {
												receiverAddress = identity.address();
											}
										}

										// TODO: hardcode for now, ask Neynar
										val sourceApp = "Warpcast";
										val sourceRef = String.format("https://warpcast.com/%s/%s",
												cast.author().username(),
												cast.hash().substring(0, 10));
										val sourceHash = cast.hash();
										// TODO: check if token available for chain
										val payment = new Payment(command.equals("batch") ?
												Payment.PaymentType.FRAME : Payment.PaymentType.INTENT,
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

										String castText;
										if (command.equals("batch")) {
											castText = String.format("@%s send funds to @%s with the frame",
													cast.author().username(),
													receiver);
										} else {
											castText = String.format("@%s send funds to @%s in the app",
													cast.author().username(),
													receiver);
										}

										val frameUrl = String.format("https://frames.payflow.me/payment/%s", payment.getReferenceId());
										val embeds = Collections.singletonList(
												new Cast.Embed(frameUrl));
										val processed = reply(castText, cast.hash(), embeds);
										if (processed) {
											log.debug("Payment batch reply sent for {}", receiver);
										}
									} catch (Throwable t) {
										log.error("Error in batch command processing: {}", job, t);
									}
								}
								job.setStatus(PaymentBotJob.Status.PROCESSED);
							}
						}
					}
					case "jar": {
						if (!StringUtils.isBlank(remainingText)) {
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
									val processed = reply(castText, cast.hash(), embeds);
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
