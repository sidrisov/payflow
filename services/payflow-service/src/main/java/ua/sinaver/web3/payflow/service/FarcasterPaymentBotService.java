package ua.sinaver.web3.payflow.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.data.bot.PaymentBotJob;
import ua.sinaver.web3.payflow.message.Token;
import ua.sinaver.web3.payflow.message.farcaster.Cast;
import ua.sinaver.web3.payflow.message.farcaster.Conversation;
import ua.sinaver.web3.payflow.message.nft.ParsedMintUrlMessage;
import ua.sinaver.web3.payflow.repository.PaymentBotJobRepository;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.repository.WalletSessionRepository;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.utils.MintUrlUtils;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class FarcasterPaymentBotService {

	private static final List<String> SUPPORTED_COMMANDS = List.of("pay", "send", "transfer",
			"batch", "jar", "mint", "collect");

	private static final String BOT_COMMAND_PATTERN = String.format(
			"\\s*(?<beforeText>.*?)?@payflow\\s+(?<command>%s)(?:\\s+(?<remaining>.+))?",
			SUPPORTED_COMMANDS.stream()
					.map(Pattern::quote)
					.collect(Collectors.joining("|")));

	@Autowired
	private PaymentBotJobRepository paymentBotJobRepository;
	@Autowired
	private IIdentityService identityService;
	@Autowired
	private FlowService flowService;
	@Autowired
	private PaymentRepository paymentRepository;
	@Autowired
	private PaymentService paymentService;
	@Autowired
	private UserService userService;
	@Autowired
	private WalletSessionRepository walletSessionRepository;
	@Autowired
	private PayflowConfig payflowConfig;
	@Autowired
	private TransactionService transactionService;
	@Autowired
	private FarcasterNeynarService neynarService;

	@Value("${payflow.farcaster.bot.enabled:false}")
	private boolean isBotEnabled;

	@Autowired
	private NotificationService notificationService;

	@Autowired
	private WalletService walletService;

	@Autowired
	private LinkService linkService;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private AnthropicAgentService anthropicAgentService;

	private void rejectJob(PaymentBotJob job, String reason, String notifyMessage, String frameUrl) {
		log.error("Rejecting job {} with reason: {}", job.getId(), reason);
		job.setStatus(PaymentBotJob.Status.REJECTED);
		paymentBotJobRepository.save(job);

		if (notifyMessage != null && job.getCast() != null) {
			notificationService.reply(notifyMessage, job.getCast().hash(),
					frameUrl != null ? Collections.singletonList(new Cast.Embed(frameUrl)) : null);
		}
	}

	private void rejectJob(PaymentBotJob job, String reason, String notifyMessage) {
		rejectJob(job, reason, notifyMessage, null);
	}

	@Scheduled(fixedRate = 60 * 1000)
	void castBotMessage() {
		if (!isBotEnabled) {
			return;
		}

		val jobs = paymentBotJobRepository.findTop10ByStatusOrderByCastedDateAsc(
				PaymentBotJob.Status.CREATED);

		jobs.forEach(job -> {
			try {
				this.processBotJob(job);
			} catch (Throwable t) {
				log.error("Something went wrong: {} - {}", job.getId(), job.getCastHash(), t);
				job.setStatus(PaymentBotJob.Status.ERROR);
			}
		});
	}

	@Async
	@Transactional(Transactional.TxType.REQUIRES_NEW)
	public void asyncProcessBotJob(Integer jobId) {
		val optionalJob = paymentBotJobRepository.findWithLockById(jobId);
		if (optionalJob.isEmpty()) {
			return;
		}
		val job = optionalJob.get();
		try {
			this.processBotJob(job);
		} catch (Throwable t) {
			log.error("Something went wrong: {}", jobId, t);
			job.setStatus(PaymentBotJob.Status.ERROR);
		}
	}

	@Transactional(Transactional.TxType.REQUIRES_NEW)
	public void processBotJob(PaymentBotJob job) {

		val cast = job.getCast();
		val text = cast.text();

		log.debug("Processing bot job {}", text);

		// Skip if text is empty or @payflow is in quotes
		if (StringUtils.isBlank(text) ||
				text.matches("([\"'`])@payflow.*?\\1")) {
			rejectJob(job, "Bot command not included or in quotes", null);
			return;
		}

		try {

			val casterProfile = userService.getOrCreateUserFromFarcasterProfile(cast.author(),
					false);

			if (casterProfile == null) {
				rejectJob(job, "Caster doesn't have payflow profile",
						"Please, sign up first!",
						payflowConfig.getDAppServiceUrl());
				return;
			}

			val isEarlyAccessUser = userService.getEarlyFeatureAccessUsers().contains(casterProfile.getUsername());

			if (isEarlyAccessUser) {
				processWithAgent(job, casterProfile);
			} else {
				processWithCommand(job, casterProfile);
			}
		} catch (Throwable t) {
			log.error("Error in bot job processing: {}", job, t);
			rejectJob(job, "Error in bot job processing",
					"Ooops, something went wrong. Please try again later or contact support if the issue persists.");
		}
	}

	private void processWithAgent(PaymentBotJob job, User casterProfile) {
		val cast = job.getCast();
		val session = walletSessionRepository.findActiveSessionsByUser(casterProfile)
				.stream().findFirst().orElse(null);

		var textWithReply = (String) null;
		val parentCast = cast.parentHash() != null ? neynarService.fetchCastByHash(cast.parentHash())
				: null;

		List<AnthropicAgentService.Message> inputMessages = new ArrayList<>();

		var parent = parentCast != null ? new Conversation.CastMessage(
				new Conversation.User(parentCast.author().username(), parentCast.author().fid()),
				parentCast.text(),
				parentCast.mentionedProfiles().stream()
						.map(p -> new Conversation.User(p.username(), p.fid())).toList())
				: null;

		var current = new Conversation.CastMessage(
				new Conversation.User(cast.author().username(), cast.author().fid()),
				cast.text(),
				cast.mentionedProfiles().stream().map(p -> new Conversation.User(p.username(), p.fid()))
						.toList());

		var conversation = new Conversation(
				new Conversation.ConversationData(parent, current));

		try {
			inputMessages.add(AnthropicAgentService.Message.builder()
					.role("user")
					.content(List.of(
							AnthropicAgentService.Message.Content.builder()
									.type("text")
									.text(String.format("""
											```json
											%s
											```""", objectMapper.writeValueAsString(conversation)))
									.build()))
					.build());
		} catch (JsonProcessingException e) {
			log.error("Failed to serialize conversation", e);
			rejectJob(job, "Failed to serialize conversation",
					"Ooops, something went wrong!");
			return;
		}

		val response = anthropicAgentService.processPaymentInput(inputMessages);
		if (response == null) {
			rejectJob(job, "Failed to process payment command with AI",
					"Ooops, something went wrong!");
			return;
		}

		List<Recipient> recipients = new ArrayList<>();

		// Process AI response
		for (val content : response.getContent()) {
			if ("tool_use".equals(content.getType())) {
				switch (content.getName()) {
					case "get_granted_session" -> {
						if (session == null) {
							rejectJob(job, "No active session found",
									"You need to create a session to grant access to one of your Payflow Balance wallets at app.payflow.me");
							return;
						}
					}
					case "send_payments" -> {
						val input = (Map<String, Object>) content.getInput();
						@SuppressWarnings("unchecked")
						val recipientsData = (List<Map<String, Object>>) input.get("recipients");

						recipients = recipientsData.stream()
								.map(data -> new Recipient(
										((String) data.get("username")).replace("@", ""),
										(String) data.get("token"),
										data.get("amount") instanceof Number
												? ((Number) data.get("amount")).doubleValue()
												: null,
										data.get("dollars") instanceof Number
												? ((Number) data.get("dollars")).doubleValue()
												: null))
								.toList();

						if (recipients.isEmpty()) {
							rejectJob(job, "No recipients specified", "Please specify at least one recipient");
							return;
						}

						// Continue processing with the recipients list...
					}
					case "buy_storage" -> {
						val input = (Map<String, Object>) content.getInput();
						val fid = ((Integer) input.get("fid"));
						notificationService.reply(textWithReply, cast.hash(),
								Collections.singletonList(new Cast.Embed(
										payflowConfig.getDAppServiceUrl() + "/fid/" + fid
												+ "/storage")));
						job.setStatus(PaymentBotJob.Status.PROCESSED);
						return;
					}
					case "get_wallet_token_balance" -> {
						if (session == null) {
							rejectJob(job, "No active session found",
									"No active session found. Create a new session to grant access to Payflow Balance at app.payflow.me");
							return;
						}

						val sessionWalletAddress = session.getWallet().getAddress();
						val tokenOrAddress = (String) content.getInput().get("token");

						log.debug("Balance check requested for token: {}", tokenOrAddress);

						val token = tokenOrAddress != null
								? tokenOrAddress.matches("0x[a-fA-F0-9]{40}")
								? paymentService.parseCommandTokens(tokenOrAddress).stream()
								.findFirst()
								.orElseGet(() -> Token.of(tokenOrAddress, "Base", 8453))
								: paymentService.parseCommandTokens(tokenOrAddress).stream()
								.findFirst()
								.orElse(null)
								: null;

						if (token == null) {
							rejectJob(job, "Token not found",
									String.format(
											"Invalid token `%s`. Please provide a valid token symbol or contract address.",
											tokenOrAddress));
							return;
						}

						val balance = walletService.getTokenBalance(
								sessionWalletAddress, token.chainId(),
								token.tokenAddress());

						if (balance == null) {
							rejectJob(job, "Token not found",
									String.format(
											"Token does not exist `%s`. Please, provide a valid token ticker or address.",
											tokenOrAddress));
						} else {
							notificationService.reply(String.format("""
													%s
													%s Balance: %s""",
											textWithReply != null ? textWithReply : "",
											balance.symbol().toUpperCase(),
											balance.formatted()),
									cast.hash(), null);

							job.setStatus(PaymentBotJob.Status.PROCESSED);
						}
						return;
					}
					case "top_up_balance" -> {
						if (session == null) {
							rejectJob(job, "No active session found",
									"No active session found. Create a new session to grant access to Payflow Balance at app.payflow.me");
							return;
						}

						val sessionWalletAddress = session.getWallet().getAddress();
						val tokenOrAddress = (String) content.getInput().get("token");

						log.debug("Top up balance for token: {}", tokenOrAddress);

						val token = paymentService.parseCommandTokens(tokenOrAddress).getFirst();

						val builder = UriComponentsBuilder
								.fromUriString(payflowConfig.getDAppServiceUrl())
								.path("/{topUpWalletAddress}");

						if (token != null) {
							builder.queryParam("tokenId", token.id());
						}

						builder.queryParam("title", "💰 Top Up Balance");

						val topUpFrameUrl = builder.build(sessionWalletAddress).toString();

						notificationService.reply(
								textWithReply,
								cast.hash(),
								List.of(new Cast.Embed(topUpFrameUrl)));

						job.setStatus(PaymentBotJob.Status.PROCESSED);
						return;
					}

				}
			} else if ("text".equals(content.getType())) {
				textWithReply = content.getText();

				if (textWithReply != null) {
					notificationService.reply(textWithReply, cast.hash(), null);
				}
			}
		}

		if (!StringUtils.equals(response.getStopReason(), "tool_use")) {
			rejectJob(job, "Ending chat", textWithReply);
			return;
		}

		if (recipients.isEmpty()) {
			rejectJob(job, "No recipients specified", "Please specify at least one recipient");
			return;
		}

		for (val recipient : recipients) {
			val tokens = paymentService.parseCommandTokens(recipient.token());
			if (tokens.isEmpty()) {
				log.error("Token not supported {}", recipient.token());
				rejectJob(job, "Token not supported: " + recipient.token(),
						String.format("Token not supported: `%s`!", recipient.token()));
				return;
			}

			Token token = tokens.getFirst();

			// Check for auto-payment eligibility
			boolean useSession = session != null;

			log.debug("Receiver: {}, amount: {}, token: {}", recipient.username(), recipient.amount(),
					recipient.token());

			List<String> receiverAddresses = null;
			// if receiver passed fetch meta from mentions
			String finalReceiver = recipient.username();
			var fcProfile = cast
					.mentionedProfiles().stream()
					.filter(p -> p.username().equals(finalReceiver)).findFirst().orElse(null);

			if (fcProfile == null && parentCast != null) {
				fcProfile = parentCast.author().username().equals(finalReceiver) ? parentCast.author()
						: parentCast.mentionedProfiles().stream()
						.filter(p -> p.username().equals(finalReceiver)).findFirst().orElse(null);
			}

			if (fcProfile == null) {
				rejectJob(job,
						String.format("Farcaster profile %s is not in the mentioned profiles list in %s",
								recipient.username(), cast),
						String.format(
								"@%s, please, mention the user with @ symbol.",
								cast.author().username()));
				return;
			}
			receiverAddresses = fcProfile.addressesWithoutCustodialIfAvailable();

			log.debug("Receiver: {} - addresses: {}", recipient.username(), receiverAddresses);

			val receiverProfile = identityService.getProfiles(receiverAddresses)
					.stream().findFirst().orElse(null);

			log.debug("Found receiver profile for receiver {} - {}",
					recipient.username(), receiverProfile);

			String receiverAddress = null;

			if (receiverProfile != null) {
				receiverAddress = paymentService.getUserReceiverAddress(receiverProfile, token.chainId());
			}

			if (receiverAddress == null) {
				receiverAddress = identityService.getHighestScoredIdentity(receiverAddresses);
			}

			val sourceApp = "Warpcast";
			val sourceRef = String.format("https://warpcast.com/%s/%s",
					cast.author().username(),
					cast.hash().substring(0, 10));
			val sourceHash = cast.hash();

			val payment = new Payment(Payment.PaymentType.INTENT, receiverProfile, token.chainId(), token.id());
			payment.setReceiverAddress(receiverAddress);
			payment.setSenderAddress(casterProfile.getIdentity());
			payment.setSender(casterProfile);
			if (recipient.dollars() != null) {
				payment.setUsdAmount(recipient.dollars().toString());
			} else {
				val tokenAmount = paymentService.parseTokenAmount(recipient.amount().toString());
				payment.setTokenAmount(tokenAmount.toString());
			}

			payment.setSourceApp(sourceApp);
			payment.setSourceRef(sourceRef);
			payment.setSourceHash(sourceHash);

			if (useSession && session != null) {
				// Check balance for session-based payments
				val sessionWalletAddress = session.getWallet().getAddress();
				val balance = walletService.getTokenBalance(
						sessionWalletAddress, token.chainId(),
						token.tokenAddress());

				val tokenAmount = paymentService.getTokenAmount(payment);

				if (balance == null
						|| new BigDecimal(balance.formatted()).compareTo(new BigDecimal(tokenAmount)) < 0) {

					paymentRepository.saveAndFlush(payment);
					val topUpFrameUrl = UriComponentsBuilder.fromUriString(payflowConfig.getDAppServiceUrl())
							.path("/{topUpWalletAddress}")
							.queryParam("tokenId", token.id())
							.queryParam("title", "💰 Top Up Balance")
							.queryParam("button", "Top Up")
							.build(sessionWalletAddress).toString();

					notificationService.reply(
							"Balance too low! Top up your wallet or pay manually:",
							cast.hash(),
							List.of(new Cast.Embed(topUpFrameUrl),
									new Cast.Embed(linkService.frameV2PaymentLink(payment).toString())));
					job.setStatus(PaymentBotJob.Status.PROCESSED);
					return;
				}

				payment.setType(Payment.PaymentType.SESSION_INTENT);
				payment.setWalletSession(session);

				val txParams = transactionService.generateTxParams(payment);
				val callsNode = objectMapper.valueToTree(List.of(txParams));
				payment.setCalls(callsNode);
			}

			paymentRepository.saveAndFlush(payment);

			String castText;
			List<Cast.Embed> embeds;

			if (payment.getType() == Payment.PaymentType.SESSION_INTENT) {
				castText = "I'm processing payment for you, wait for confirmation:";
				embeds = Collections.singletonList(
						new Cast.Embed(linkService.frameV2PaymentLink(payment).toString()));

				paymentService.asyncProcessSessionIntentPayment(payment.getId());
			} else {
				castText = String.format(
						"@%s, pay using frame below (no active session found to process automatically)",
						cast.author().username());
				embeds = Collections.singletonList(
						new Cast.Embed(linkService.frameV2PaymentLink(payment).toString()));
			}

			job.setStatus(PaymentBotJob.Status.PROCESSED);
			notificationService.reply(castText, cast.hash(), embeds);
		}
	}

	private void processWithCommand(PaymentBotJob job, User casterProfile) {
		val cast = job.getCast();
		val text = cast.text();
		var matcher = Pattern.compile(
						BOT_COMMAND_PATTERN, Pattern.DOTALL)
				.matcher(text);

		if (!matcher.find()) {
			job.setStatus(PaymentBotJob.Status.REJECTED);
			return;
		}

		val command = matcher.group("command");
		val remainingText = matcher.group("remaining");

		if (!command.equals("mint") && StringUtils.isBlank(remainingText)) {
			rejectJob(job, "No other text included after command: " + command,
					"Please, include additional details after command: \"@payflow " + command + "\"");
			return;
		}

		val beforeText = matcher
				.group("beforeText");
		log.debug("Bot command detected {} for {}, remaining {}", command, cast, remainingText);

		switch (command) {
			case "agent":
			case "pay":
			case "transfer":
			case "send": {
				log.debug("Processing {} bot command arguments {}", command, remainingText);

				// Common variables
				String receiverName = null;
				String amountStr = null;
				String restText = null;
				Token token;

				val parentCast = cast.parentHash() != null ? neynarService.fetchCastByHash(cast.parentHash())
						: null;

				val session = walletSessionRepository.findActiveSessionsByUser(casterProfile)
						.stream().findFirst().orElse(null);

				// Regular payment processing
				val paymentPattern = "(?:@(?<receiver>[a-zA-Z0-9_.-]+)\\s*)?\\s*(?<amount>\\$?[0-9]+(?:\\.[0-9]+)?[km]?)\\s*(?<rest>.*)";
				matcher = Pattern.compile(paymentPattern, Pattern.CASE_INSENSITIVE).matcher(remainingText);
				if (!matcher.find()) {
					rejectJob(job, "Pattern not matched for command: " + command,
							"Invalid format. Please use: \"@payflow " + command + " @user amount token\"");
					return;
				}

				receiverName = matcher.group("receiver");
				amountStr = matcher.group("amount");
				restText = matcher.group("rest");

				// Common token processing
				val tokens = paymentService.parseCommandTokens(restText);
				if (tokens.size() == 1) {
					token = tokens.getFirst();
				} else {
					val chain = paymentService.parseCommandChain(restText);
					token = tokens.stream().filter(t -> t.chain().equals(chain)).findFirst().orElse(null);
				}

				if (token == null) {
					log.error("Token not supported {}", restText);
					rejectJob(job, "Token not supported: " + restText,
							String.format("Token not supported: `%s`!", restText));
					return;
				}

				log.debug("Receiver: {}, amount: {}, token: {}", receiverName, amountStr, token);

				List<String> receiverAddresses = null;
				// if receiver passed fetch meta from mentions
				if (!StringUtils.isBlank(receiverName)) {
					String finalReceiver = receiverName;
					var fcProfile = cast
							.mentionedProfiles().stream()
							.filter(p -> p.username().equals(finalReceiver)).findFirst().orElse(null);

					if (fcProfile == null && parentCast != null) {
						fcProfile = parentCast.author().username().equals(finalReceiver) ? parentCast.author()
								: parentCast.mentionedProfiles().stream()
								.filter(p -> p.username().equals(finalReceiver)).findFirst()
								.orElse(null);
					}

					if (fcProfile == null) {
						rejectJob(job,
								String.format(
										"Farcaster profile %s is not in the mentioned profiles list in %s",
										receiverName, cast),
								String.format(
										"@%s, please, mention the user with @ symbol.",
										cast.author().username()));
						return;
					}
					receiverAddresses = fcProfile.addressesWithoutCustodialIfAvailable();
				}

				// if a reply, fetch through airstack
				if (StringUtils.isBlank(receiverName)) {
					if (parentCast != null) {
						receiverName = parentCast.author().username();
						receiverAddresses = parentCast.author().addressesWithoutCustodialIfAvailable();
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

				val sourceApp = "Warpcast";
				val sourceRef = String.format("https://warpcast.com/%s/%s",
						cast.author().username(),
						cast.hash().substring(0, 10));
				val sourceHash = cast.hash();

				val payment = new Payment(Payment.PaymentType.INTENT, receiverProfile, token.chainId(),
						token.id());
				payment.setReceiverAddress(receiverAddress);
				payment.setSenderAddress(casterProfile.getIdentity());
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

				if (session != null) {
					// Check balance for session-based payments
					val sessionWalletAddress = session.getWallet().getAddress();
					val balance = walletService.getTokenBalance(
							sessionWalletAddress, token.chainId(),
							token.tokenAddress());

					val tokenAmount = paymentService.getTokenAmount(payment);

					if (balance == null
							|| new BigDecimal(balance.formatted()).compareTo(new BigDecimal(tokenAmount)) < 0) {

						paymentRepository.saveAndFlush(payment);
						val topUpFrameUrl = UriComponentsBuilder
								.fromUriString(payflowConfig.getDAppServiceUrl())
								.path("/{topUpWalletAddress}")
								.queryParam("tokenId", token.id())
								.queryParam("title", "💰 Top Up Balance")
								.queryParam("button", "Top Up")
								.build(sessionWalletAddress).toString();

						notificationService.reply(
								"Balance too low! Top up your wallet or pay manually:",
								cast.hash(),
								List.of(new Cast.Embed(topUpFrameUrl),
										new Cast.Embed(linkService.frameV2PaymentLink(payment).toString())));
						job.setStatus(PaymentBotJob.Status.PROCESSED);
						return;
					}

					payment.setType(Payment.PaymentType.SESSION_INTENT);
					payment.setWalletSession(session);

					val txParams = transactionService.generateTxParams(payment);
					val callsNode = objectMapper.valueToTree(List.of(txParams));
					payment.setCalls(callsNode);
				}

				paymentRepository.saveAndFlush(payment);

				String castText;
				List<Cast.Embed> embeds;

				if (payment.getType() == Payment.PaymentType.SESSION_INTENT) {
					castText = "I'm processing payment for you, wait for confirmation:";
					embeds = Collections.singletonList(
							new Cast.Embed(linkService.frameV2PaymentLink(payment).toString()));

					paymentService.asyncProcessSessionIntentPayment(payment.getId());
				} else {
					castText = String.format(
							"@%s, pay using frame below (no active session found to process automatically)",
							cast.author().username());
					embeds = Collections.singletonList(
							new Cast.Embed(linkService.frameV2PaymentLink(payment).toString()));
				}

				job.setStatus(PaymentBotJob.Status.PROCESSED);
				notificationService.reply(castText, cast.hash(), embeds);
				break;
			}
			case "batch":
			case "intents": {
				log.debug("Processing {} bot command arguments {}", command, remainingText);

				val batchPattern = "\\s*(?<amount>\\$?[0-9]+(?:\\.[0-9]+)?[km]?)?\\s*(?<rest>.*)";
				matcher = Pattern.compile(batchPattern, Pattern.CASE_INSENSITIVE).matcher(remainingText);
				if (!matcher.find()) {
					rejectJob(job, "Pattern not matched for command: " + command,
							"Invalid format. Please use: \"@payflow " + command
									+ " amount [eth|usdc] @user1 @user2\"");
					return;
				}

				val restText = matcher.group("rest");
				val mentions = cast.mentionedProfiles().stream()
						.filter(u -> !u.username().equals("payflow")
								&& !u.username().equals("bountybot"))
						.distinct().toList();

				if (mentions.isEmpty()) {
					rejectJob(job, "At least one mention should be specified in batch command",
							"Please mention at least one recipient. Example: \"@payflow " + command
									+ " amount [eth|usdc] @user1 @user2\"");
					return;
				}

				Token token = null;
				val tokens = paymentService.parseCommandTokens(restText);
				if (tokens.size() == 1) {
					token = tokens.getFirst();
				} else {
					val chain = paymentService.parseCommandChain(restText);
					token = tokens.stream().filter(t -> t.chain().equals(chain)).findFirst().orElse(null);
				}

				if (token == null) {
					rejectJob(job, "Token not supported: " + restText,
							"Token not supported! Please use: \"@payflow " + command
									+ " amount [eth|usdc] @user1 @user2\"");
					return;
				}

				log.debug("Receivers: {}, amount: {}, token: {}",
						mentions, restText, token);

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

						val sourceApp = "Warpcast";
						val sourceRef = String.format("https://warpcast.com/%s/%s",
								cast.author().username(),
								cast.hash().substring(0, 10));
						val sourceHash = cast.hash();
						val payment = new Payment(Payment.PaymentType.INTENT,
								receiverProfile,
								token.chainId(), token.id());
						payment.setReceiverAddress(receiverAddress);
						payment.setSender(casterProfile);
						if (restText.startsWith("$")) {
							payment.setUsdAmount(restText.replace("$", ""));
						} else {
							val tokenAmount = paymentService.parseTokenAmount(restText.toLowerCase());
							payment.setTokenAmount(tokenAmount.toString());
						}
						payment.setSourceApp(sourceApp);
						payment.setSourceRef(sourceRef);
						payment.setSourceHash(sourceHash);
						paymentRepository.saveAndFlush(payment);
						String castText = String.format("@%s pay using frame below",
								cast.author().username());

						val frameUrl = linkService.frameV2PaymentLink(payment).toString();
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
				if (!matcher.find() || StringUtils.isBlank(matcher.group("title"))) {
					rejectJob(job, "Missing or empty jar title",
							"Please provide a title in quotes. Example: \"@payflow jar \\\"My Jar Title\\\"\"");
					return;
				}

				val title = matcher.group("title");
				val image = cast.embeds() != null ? cast.embeds().stream()
						.filter(embed -> embed != null && embed.url() != null &&
								(embed.url().endsWith(".png") || embed.url().endsWith(".jpg")))
						.findFirst().map(Cast.Embed::url).orElse(null) : null;

				val addresses = cast.author().verifications();
				addresses.add(cast.author().custodyAddress());
				val profile = identityService.getProfiles(addresses).stream().findFirst().orElse(null);

				if (profile == null) {
					rejectJob(job, "Caster doesn't have payflow profile",
							"Please sign in to the app first!",
							payflowConfig.getDAppServiceUrl());
					return;
				}

				if (StringUtils.isBlank(title)) {
					rejectJob(job, "Empty jar title",
							"Please provide a non-empty title for your jar.");
					return;
				}

				log.debug("Executing jar creation with title `{}`, desc `{}`, " +
								"embeds {}, source {}",
						title, beforeText, cast.embeds(),
						String.format("https://warpcast.com/%s/%s",
								cast.author().username(),
								cast.hash().substring(0, 10)));

				val jar = flowService.createJar(title, beforeText,
						image, String.format("https://warpcast.com/%s/%s",
								cast.author().username(),
								cast.hash().substring(0, 10)),
						profile);
				log.debug("Jar created {}", jar);

				val castText = String.format("@%s receive jar contributions with the frame",
						cast.author().username());
				val embeds = Collections.singletonList(
						new Cast.Embed(String.format("https://app.payflow" +
										".me/jar/%s",
								jar.getFlow().getUuid())));
				val processed = notificationService.reply(castText, cast.hash(), embeds);
				if (processed) {
					job.setStatus(PaymentBotJob.Status.PROCESSED);
					return;
				}
				break;
			}
			case "collect":
			case "mint": {
				log.debug("Processing mint command for cast: {}", cast);

				// Get parent cast for mint URLs
				val parentCast = cast.parentHash() != null ? neynarService.fetchCastByHash(cast.parentHash())
						: null;

				if (parentCast == null || parentCast.embeds() == null || parentCast.embeds().isEmpty()) {
					rejectJob(job, "No links found in parent cast",
							"Please reply to a cast containing a mint link");
					return;
				}

				val embeds = parentCast.embeds().stream()
						.map(Cast.Embed::url)
						.filter(Objects::nonNull)
						.toList();

				log.debug("Potential collectible embeds: {}", embeds);
				ParsedMintUrlMessage parsedMintUrlMessage = null;
				for (val embed : embeds) {
					parsedMintUrlMessage = ParsedMintUrlMessage.parse(embed);
					if (parsedMintUrlMessage != null) {
						break;
					}
				}

				if (parsedMintUrlMessage == null) {
					rejectJob(job, "No supported collection found",
							"No supported collection found in parent cast");
					return;
				}

				val chainId = MintUrlUtils.getChainId(parsedMintUrlMessage);
				if (chainId == null) {
					rejectJob(job, "Chain not supported",
							String.format("Mints on `%s` not supported!", parsedMintUrlMessage.chain()));
					return;
				}

				val token = String.format("%s:%s:%s:%s:%s",
						parsedMintUrlMessage.provider(),
						parsedMintUrlMessage.contract(),
						Optional.ofNullable(parsedMintUrlMessage.tokenId()).map(String::valueOf).orElse(""),
						Optional.ofNullable(parsedMintUrlMessage.referral()).orElse(""),
						Optional.ofNullable(parsedMintUrlMessage.author()).orElse(""));

				val payment = new Payment(Payment.PaymentType.INTENT, null, chainId, token);
				payment.setCategory("mint");
				payment.setToken(token);
				payment.setReceiverFid(cast.author().fid());
				payment.setReceiverAddress(casterProfile.getIdentity());
				payment.setSender(casterProfile);
				payment.setSourceApp("Warpcast");
				payment.setSourceRef(String.format("https://warpcast.com/%s/%s",
						cast.author().username(),
						cast.hash().substring(0, 10)));
				payment.setSourceHash(cast.hash());
				payment.setTarget(parsedMintUrlMessage.url());

				paymentRepository.saveAndFlush(payment);

				val castText = String.format("@%s mint using frame below",
						cast.author().username());
				val frameEmbeds = Collections.singletonList(
						new Cast.Embed(linkService.frameV2PaymentLink(payment).toString()));
				notificationService.reply(castText, cast.hash(), frameEmbeds);

				job.setStatus(PaymentBotJob.Status.PROCESSED);
				break;
			}

			default: {
				log.error("Command not supported: {}", command);
			}
		}
	}

	private record Recipient(
			String username,
			String token,
			Double amount,
			Double dollars) {
	}
}
