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
import ua.sinaver.web3.payflow.data.bot.PaymentBotJob;
import ua.sinaver.web3.payflow.message.CastEmbed;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.repository.PaymentBotJobRepository;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.api.IFlowService;
import ua.sinaver.web3.payflow.service.api.IFrameService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;

import static ua.sinaver.web3.payflow.service.TransactionService.*;

@Service
@Transactional
@Slf4j
public class FarcasterPaymentBotService {

	@Autowired
	private FarcasterHubService hubService;

	@Autowired
	private PaymentBotJobRepository paymentBotJobRepository;

	@Autowired
	private IFrameService frameService;

	@Autowired
	private IFlowService flowService;

	@Autowired
	private PaymentRepository paymentRepository;

	@Value("${payflow.farcaster.bot.cast.signer}")
	private String botSignerUuid;

	@Value("${payflow.farcaster.bot.enabled:false}")
	private boolean isBotEnabled;

	@Value("${payflow.farcaster.bot.reply.enabled:true}")
	private boolean isBotReplyEnabled;

	@Value("${payflow.farcaster.bot.test.enabled:false}")
	private boolean isTestBotEnabled;

	@Autowired
	private IIdentityService identityService;


	public static String parseToken(String text) {
		val pattern = Pattern.compile("\\b(?<token>eth|degen|usdc)\\b");
		val matcher = pattern.matcher(text);
		return matcher.find() ? matcher.group("token") : "usdc";
	}

	public static String parseChain(String text) {
		val pattern = Pattern.compile("\\b(?<chain>base|optimism|degen-l3)\\b");
		val matcher = pattern.matcher(text);
		if (matcher.find()) {
			var matched = matcher.group("chain");
			if (matched.equals("degen-l3")) {
				matched = DEGEN_CHAIN_NAME;
			}
			return matched;
		}
		return BASE_CHAIN_NAME;
	}

	public boolean reply(String text, String parentHash, List<CastEmbed> embeds) {
		if (isBotReplyEnabled) {
			val response = hubService.cast(botSignerUuid, text, parentHash, embeds);
			if (response.success()) {
				log.debug("Successfully processed bot cast with reply: {}",
						response.cast());
				return true;
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

				val casterAddresses = cast.author().verifications();
				casterAddresses.add(cast.author().custodyAddress());

				val casterProfile = frameService.getFidProfiles(casterAddresses)
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
								new CastEmbed(
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
						String amount = null;
						String restText;
						String token = null;
						String chain = null;

						List<String> receiverAddresses = null;
						if (!StringUtils.isBlank(remainingText)) {
							log.debug("Processing {} bot command arguments {}", command, remainingText);

							val sendPattern = "(?:@(?<receiver>[a-zA-Z0-9_.-]+)\\s*)?\\s*(?:\\$(?<amount>[0-9]+(?:\\.[0-9]+)?))?\\s*(?<rest>.*)";
							matcher = Pattern.compile(sendPattern, Pattern.CASE_INSENSITIVE).matcher(remainingText);
							if (matcher.find()) {
								receiver = matcher.group("receiver");
								amount = matcher.group("amount");
								restText = matcher.group("rest").toLowerCase();

								token = parseToken(restText);
								chain = parseChain(restText);

								log.debug("Receiver: {}, amount: ${}, token: {}, chain: {}",
										receiver, amount, token, chain);

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

									receiverAddresses = fcProfile.verifications();
									receiverAddresses.add(fcProfile.custodyAddress());
								}
							}
						}

						// if a reply, fetch through airstack
						if (StringUtils.isBlank(receiver) && cast.parentAuthor().fid() != null) {
							receiver = frameService.getFidFname(cast.parentAuthor().fid());
							receiverAddresses = frameService.getFidAddresses(cast.parentAuthor().fid());
						}

						log.debug("Receiver: {} - addresses: {}", receiver, receiverAddresses);

						if (receiver != null) {
							val receiverProfile = frameService.getFidProfiles(receiverAddresses)
									.stream().findFirst().orElse(null);

							log.debug("Found receiver profile for receiver {} - {}",
									receiver, receiverProfile);

							String receiverAddress = null;
							if (receiverProfile == null) {
								val identity = identityService.getIdentitiesInfo(receiverAddresses)
										.stream().max(Comparator.comparingInt(IdentityMessage::score)).orElse(null);
								if (identity != null) {
									receiverAddress = identity.address();
								}
							}

							String refId = null;
							if (amount != null) {
								// TODO: hardcode for now, ask Neynar
								val sourceApp = "Warpcast";
								val sourceRef = String.format("https://warpcast.com/%s/%s",
										cast.author().username(),
										cast.hash().substring(0, 10));
								// TODO: check if token available for chain
								val payment = new Payment(command.equals("send") ?
										Payment.PaymentType.FRAME : Payment.PaymentType.INTENT,
										receiverProfile,
										PAYMENT_CHAIN_IDS.get(chain), token);
								payment.setReceiverAddress(receiverAddress);
								payment.setSender(casterProfile);
								payment.setUsdAmount(amount);
								payment.setSourceApp(sourceApp);
								payment.setSourceRef(sourceRef);
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
									new CastEmbed(frameUrl));

							val processed = reply(castText, cast.hash(), embeds);
							if (processed) {
								job.setStatus(PaymentBotJob.Status.PROCESSED);
								return;
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
								val title = matcher.group("title");
								val image = cast.embeds() != null ? cast.embeds().stream()
										.filter(embed -> embed != null && embed.url() != null && (embed.url().endsWith(
												".png") || embed.url().endsWith(".jpg")))
										.findFirst().map(CastEmbed::url).orElse(null) : null;
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

									val profile = frameService.getFidProfiles(addresses)
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
											new CastEmbed(String.format("https://frames.payflow.me/jar/%s",
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
