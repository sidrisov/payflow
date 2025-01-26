package ua.sinaver.web3.payflow.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelOption;
import jakarta.annotation.PostConstruct;
import lombok.Builder;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import ua.sinaver.web3.payflow.message.Token;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AnthropicAgentService {

	private static final String CORE_PROMPT = """
			``` Payflow Agent Prompt v0.0.10 ```

			You're Payflow Agent - an AI companion for Onchain Social Payments on Farcaster.

			Core Information:
				- Created by @sinaver.eth
				- Purpose: Making Onchain Social Payments simple
				- Personality: Friendly, fun, and direct in responses

			Input Format:
				{
				"conversation": {
					"cast": {
					"author": {"username": string, "displayName": string, "fid": number},
					"text": string,
					"directReplies": [
						{
						"author": {"username": string, "displayName": string, "fid": number},
						"text": string
						}
					]
					},
					"chronologicalParentCasts": [
					{
						"author": {"username": string, "displayName": string, "fid": number},
						"text": string
					}
					]
				}
				}

			General Rules:
				1. You can reply with general information about Payflow app and agent
				2. When asked if something is supported, answer both for app and agent
				3. Identify if user requests particular service or general inquiry or question
				4. Apply service-specific rules and processing if you identify the request as service request
				5. Keep responses focused and concise, make it more consumer friendly
				6. Address user directly and use present tense (avoid I'll, I'm, etc.)
				7. Always tag user in response, if user is mentioned
				8. Don't mention technical details, e.g. which tool is used (send_payments, buy_storage, etc.), instead mention the name of the service
				9. You are allowed to reply to multiple questions in one response
				10. Priritize answering inquiries in current cast of conversation, and then in parent cast if user inclined so
				11. Prioritize answering general inquiries and then proceeding with those requiring an action
				12. Don't provide any information about something that is not specifically asked
				13. If someone shares something about you, be cool and greatful about it

			General Payflow App features:

				Payflow is Onchain Social Payments Hub on Farcaster utilising all the protocol development legos:
				frames, cast actions, composer actions, bots, mini-app tx, and frame v2 to provide the best payment
				experience for the user in social feed, allowing users to pay with any token cross-chain with verified
				addresses or Payflow Balance for 1-click gasless experience:

				1. Payment provider in Warpcast Pay
				2. P2P or rewards (cast, top comment, top casters) payments with cross-chain (bridging) support
				3. Shareable custom "Pay Me" frames for any verified address / token amount
				4. Buy or gift storage
				5. Minting or gifting collectibles
				6. Buy or gift fan tokens
				7. Subscribe or gift hypersub
				8. Claimables for degen & moxie
				9. Storage expiration notifications (with different criterias and threshold configuration)
				10. Intents, receipts, and activity view
				11. Cross-chain payments refunds
				12. Payment flow lists & balance
				13. Contact book across farcaster and other social graph data (your wallets, recent, transacted, favourites
				14. App settings:
				- preferred payment flow (default receiving and spending wallet)
				- preferred tokens list (shown in user frame or in the token selection dialog)
				- preferred farcaster client (for cast action installation)


			Supported chains:
				- Base (8453)
				- Optimism (10)
				- Arbitrum (42161)
				- Degen L3 (666666666)
				- Ham L3 (5112)

			Supported tokens:
			   ```json
			   %s
			   ```
			""";

	private static final String NO_REPLY_PROMPT = """
			Reply vs Not Reply Prompt:

			You should reply to user most of the time:
			- user needs your help or assistance
			- user requests specific service, e.g. pay @user1 100 usdc
			- user asks general questions about agent, e.g. how to use it, what it can do?
			- user directly asks you literally about anything, e.g. hey @payflow ... what do you think?
			- user asks about a feature, e.g. can you do that? is it supported? can you bridge tokens?
			- user follows up on previous agent response

			You should not reply on rare ocasions to user when:
			- no reply doesn't indicate that there is no action required, it just means that agent doesn't have anything to reply
			- when query is not related to available services, payments, and agent
			- nothing is inquired or asked from agent directly
			- user mentions payflow app or agent on using it for something
			- user shares that you can use payflow for something, e.g. to paticipate in raffle
			- user tool: no_reply
			""";

	private static final String SERVICES_PROMPT = """
			Available Services Agent Prompt:
			1. Send payments
			   - Understand the user payment request and process it
			   - Make sure user explicitly asks to make a payment
			   - Aggregates multiple payments into single tool call
			   - Provide detailed response with payment details
			   - If chain not specified, default to Base (8453)
			   - If token is available on multiple chains, default to Base (8453), e.g. for USDC, DEGEN, ETH, etc.
			   - Automated payments are available only on Base
			   - Recipient is mentioned user in current cast, otherwise fallback to parent cast author
			   - Input token and amount should be mention in current cast, if not fallback to parent cast author
			   - You can interpret approximate amounts (e.g., "few bucks" ≈ $5, "couple tokens" ≈ 2)
			   - Don't request to check balance
			   - Use tool: send_payments

			   Valid Payment Commands:
			   - pay @user <amount> <token>
			   - send @user <amount> <token>
			   - transfer @user <amount> <token>

			   Examples:
			   - send @user1 @user2 @user3 100 USDC each
			   - split 100 USDC between @user1 @user2 @user3
			   - pay @user1 $5 ETH
			   - transfer @user2 50 degen - chain not passed, default to Base (8453)
			   - send @user3 100 degen on l3 - chain l3 is passed, means Degen L3 (666666666)
			   - send some degen - chain not passed, default to Base (8453), recipient in the parent cast

			2. Buy farcaster storage
			   - Buy farcaster storage for your account, mentioned user, or for parent cast author
			   - Use tool: buy_storage to reply with app frame to make storage purchase

			3. Check token balance
			   - Check balance of particular token
			   - Use tool: get_wallet_token_balance to check and reply with token balance

			4. Top up balance
			   - Top up your Payflow Balance wallet with supported tokens, token is optional
			   - Use tool: top_up_balance to reply with app frame to make top up

			5. Minting NFTs
			   - not yet available, but comming soon
			6. Pay Me
			   - Respond with a payment link to accept payments
			   - Tag user in response with link to payment, if user is mentioned:
			   		e.g. @user1 pay me 5 usdglo -> ... @user1 @alice requested payment ...
			   - Use tool: pay_me to generate a payment link

				Input:
				- userId - current author username
				- amount - token amount to pay (e.g. 100), if not provided, use dollars
				- dollars - usd amount to pay (e.g. 5), if not provided, use amount
				- token - token id to pay, e.g. USDC, ETH, etc.
				- chainId - chain id to pay, for now only Base (8453) is supported
				- title - title of the payment (optional)

				Output:
				- link to payment
			7. Claim Degen or Moxie
			   - Claim Degen or Moxie
			   - Use tool: claim_degen_or_moxie to reply with app frame to make claim
			""";

	// - Use tool: pay_me to generate a payment link to accept payments

	private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

	private static final List<Tool> DEFAULT_TOOLS = List.of(
			Tool.builder()
					.name("no_reply")
					.description("Use this when no response should be given")
					.inputSchema(
							Tool.InputSchema.builder()
									.type("object")
									.properties(Map.of(
											"reason", Tool.InputSchema.Property.builder()
													.type("string")
													.description("Reason for not replying")
													.build()))
									.required(List.of("reason"))
									.build())
					.build(),
			Tool.builder()
					.name("send_payments")
					.description("Send payment to one or more users")
					.inputSchema(
							Tool.InputSchema.builder()
									.type("object")
									.properties(Map.of(
											"recipients", Tool.InputSchema.Property.builder()
													.type("array")
													.description("List of payment recipients")
													.items(Tool.InputSchema.Items.builder()
															.type("object")
															.properties(Map.of(
																	"username", Tool.InputSchema.Property.builder()
																			.type("string")
																			.description("Recipient's username")
																			.build(),
																	"chainId", Tool.InputSchema.Property.builder()
																			.type("number")
																			.description(
																					"Chain ID, default is Base (8453)")
																			.build(),
																	"token", Tool.InputSchema.Property.builder()
																			.type("string")
																			.description(
																					"Token identifier (e.g., USDC, ETH)")
																			.build(),
																	"amount", Tool.InputSchema.Property.builder()
																			.type("number")
																			.description("Amount in tokens")
																			.build(),
																	"dollars", Tool.InputSchema.Property.builder()
																			.type("number")
																			.description("Amount in USD")
																			.build()))
															.required(List.of("username", "chainId", "token"))
															.build())
													.build()))
									.required(List.of("recipients"))
									.build())
					.build(),
			Tool.builder()
					.name("buy_storage")
					.description("Buy storage for your account, mentioned user, or for parent cast author")
					.inputSchema(
							Tool.InputSchema.builder()
									.type("object")
									.properties(Map.of(
											"fid", Tool.InputSchema.Property.builder()
													.type("number")
													.description("User fid to buy storage for")
													.build()))
									.required(List.of("fid"))
									.build())
					.build(),
			Tool.builder()
					.name("get_wallet_token_balance")
					.description("Get balance of particular token")
					.inputSchema(Tool.InputSchema.builder().type("object").properties(
							Map.of("token",
									Tool.InputSchema.Property.builder().type("string")
											.description("Token identifier like $token, token, or token address")
											.build()))
							.required(List.of("token")).build())
					.build(),
			Tool.builder()
					.name("top_up_balance")
					.description("Top up your Payflow Balance")
					.inputSchema(Tool.InputSchema.builder().type("object").properties(
							Map.of(
									"token",
									Tool.InputSchema.Property.builder().type("string").description("Token to top up")
											.build()))
							.build())
					.cacheControl(Map.of("type", "ephemeral"))
					.build(),
			Tool.builder()
					.name("pay_me")
					.description("Generate a payment link to accept payments")
					.inputSchema(
							Tool.InputSchema.builder()
									.type("object")
									.properties(Map.of(
											"userId", Tool.InputSchema.Property.builder()
													.type("string")
													.description("User ID requesting the payment")
													.build(),
											"token", Tool.InputSchema.Property.builder()
													.type("string")
													.description("Token identifier (e.g., USDC, ETH)")
													.build(),
											"chainId", Tool.InputSchema.Property.builder()
													.type("number")
													.description("Chain ID")
													.build(),
											"amount", Tool.InputSchema.Property.builder()
													.type("number")
													.description("Amount in tokens")
													.build(),
											"dollars", Tool.InputSchema.Property.builder()
													.type("number")
													.description("Amount in USD")
													.build(),
											"title", Tool.InputSchema.Property.builder()
													.type("string")
													.description("Title of the payment")
													.build()))
									.required(List.of("userId", "chainId", "token"))
									.build())
					.build(),
			Tool.builder()
					.name("claim_degen_or_moxie")
					.description("Claim Degen or Moxie")
					.inputSchema(Tool.InputSchema.builder().type("object").properties(Map.of(
							"asset", Tool.InputSchema.Property.builder().type("string")
									.description("Asset to claim")
									.build()))
							.required(List.of("asset")).build())
					.build());
	private final WebClient webClient;
	@Autowired
	private TokenService tokenService;
	@Autowired
	private ObjectMapper objectMapper;
	private List<SystemMessage> systemPrompt;
	private List<Tool> tools;

	public AnthropicAgentService(
			@org.springframework.beans.factory.annotation.Value("${anthropic.api.key}") String anthropicApiKey,
			WebClient.Builder webClientBuilder) {

		this.webClient = webClientBuilder
				.baseUrl(ANTHROPIC_API_URL)
				.defaultHeader("Content-Type", "application/json")
				.defaultHeader("Accept", "application/json")
				.defaultHeader("x-api-key", anthropicApiKey)
				.defaultHeader("anthropic-version", "2023-06-01")
				.clientConnector(new ReactorClientHttpConnector(HttpClient.create()
						.responseTimeout(Duration.ofSeconds(30))
						.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000)))
				.build();
	}

	@PostConstruct
	private void initialize() {
		try {
			val tokenAddresses = tokenService.getTokens().stream()
					.collect(Collectors.toMap(
							Token::id,
							token -> token.tokenAddress() != null ? token.tokenAddress() : TokenService.ZERO_ADDRESS,
							(a, b) -> a));

			val tokenMapJson = objectMapper
					.writerWithDefaultPrettyPrinter()
					.writeValueAsString(tokenAddresses);

			this.systemPrompt = List.of(
					SystemMessage.builder()
							.type("text")
							.text(CORE_PROMPT.formatted(tokenMapJson))
							.build(),
					SystemMessage.builder()
							.type("text")
							.text(SERVICES_PROMPT)
							.build(),
					SystemMessage.builder()
							.type("text")
							.text(NO_REPLY_PROMPT)
							.build());

			this.tools = DEFAULT_TOOLS;

			log.info("Initialized AnthropicAgentService with {} tokens", tokenAddresses.size());
		} catch (JsonProcessingException e) {
			log.error("Failed to serialize tokens to JSON", e);
			throw new RuntimeException("Failed to initialize system prompt", e);
		}
	}

	/**
	 * Before executing a payment use tools to check if the user has created a
	 * session key to grant access to his wallet, and if amount is enough.
	 * <p>
	 * Use tools to check balance and valid session, if session not available,
	 * prompt user to create a session by replying You need to create a session to
	 * grant access to one of your Payflow Balance wallets at app.payflow.me
	 */

	public AnthropicResponse processPaymentInput(List<Message> messages) {
		try {
			val request = AnthropicRequest.builder()
					.model("claude-3-5-haiku-20241022")
					.maxTokens(4096)
					.temperature(0.85)
					.tools(tools)
					.system(systemPrompt)
					.messages(messages).build();

			log.info("Anthropic API request: {}",
					objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(request));

			val response = webClient.post()
					.bodyValue(request)
					.retrieve()
					.onStatus(status -> status.equals(HttpStatus.BAD_REQUEST), clientResponse -> {
						log.error("Anthropic API request failed: {}", clientResponse);
						return Mono.error(new RuntimeException("Anthropic API request failed"));
					})
					.bodyToMono(AnthropicResponse.class)
					.retry(3)
					.block();

			log.info("Anthropic API response: {}", response);

			return response;
		} catch (Exception e) {
			log.error("Failed to process input: {}", messages, e);
		}

		return null;
	}

	@Builder
	@Value
	public static class Message {
		String role;
		List<Content> content;

		@Builder
		@Value
		public static class Content {
			String type;
			String text;
		}
	}

	@Builder
	@Value
	static class SystemMessage {
		String type;
		String text;
		@JsonProperty("cache_control")
		@Builder.Default
		Map<String, String> cacheControl = Map.of("type", "ephemeral");
	}

	@Builder
	@Value
	static class Tool {
		String name;
		String description;
		@JsonProperty("input_schema")
		InputSchema inputSchema;
		@JsonProperty("cache_control")
		Map<String, String> cacheControl;

		@Builder
		@Value
		static class InputSchema {
			String type;
			@Builder.Default
			Map<String, Property> properties = Map.of();
			@Builder.Default
			List<String> required = List.of();

			@Builder
			@Value
			static class Property {
				String type;
				String description;
				Items items;
			}

			@Builder
			@Value
			static class Items {
				String type;
				@Builder.Default
				Map<String, Property> properties = Map.of();
				@Builder.Default
				List<String> required = List.of();
			}
		}
	}

	@Builder
	@Value
	static class AnthropicRequest {
		String model;
		@JsonProperty("max_tokens")
		int maxTokens;
		@Builder.Default
		Double temperature = 1.0;
		List<SystemMessage> system;
		List<Tool> tools;
		List<Message> messages;
	}

	@Builder
	@Value
	public static class AnthropicResponse {
		String id; // message ID (e.g., msg_018fbL1nnasS31AK8iKK2X7C)
		String type; // message type
		String role; // assistant
		String model; // claude-3-5-sonnet-20241022
		List<Content> content;
		@JsonProperty("stop_reason")
		String stopReason; // tool_use, end_turn, etc.
		@JsonProperty("stop_sequence")
		String stopSequence;
		Usage usage;

		@Builder
		@Value
		public static class Content {
			String type; // text or tool_use
			String text; // for text type
			String id; // tool ID for tool_use type (e.g., toolu_013Ank1xhbedLnYvaEQ3HzGD)
			String name; // tool name for tool_use type
			Map<String, Object> input; // tool input parameters
		}

		@Builder
		@Value
		static class Usage {
			@JsonProperty("input_tokens")
			int inputTokens;
			@JsonProperty("cache_creation_input_tokens")
			int cacheCreationInputTokens;
			@JsonProperty("cache_read_input_tokens")
			int cacheReadInputTokens;
			@JsonProperty("output_tokens")
			int outputTokens;
		}
	}
}
