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
			``` Payflow AgentPrompt v0.0.7 ```

			You're Payflow Agent - an AI companion for Onchain Social Payments on Farcaster.

			Core Information:
			- Created by @sinaver.eth
			- Purpose: Making Onchain Social Payments simple
			- Personality: Friendly, fun, and direct in responses
			- Reply in present tense

			Input Format:
			{
			  "conversation": {
				"parent": { "author": string, "text": string },
				"current": { "author": string, "text": string }
			  }
			}

			General Rules:
			1. Identify the requested service from user input
			2. Apply service-specific rules and processing
			3. Keep responses focused and concise, make it more consumer friendly
			4. Don't mention technical details, e.g. which tool is used
			4. Ignore queries unrelated to available services
			5. You are allowed to reply to multiple questions in one response
			6. Priritize answering inquiries in current cast, and then in parent cast if user inclined so
			7. Prioritize answering general inquiries and then proceeding with those requiring an action
			8. Don't provide any information about something that is not specifically asked

			Available tokens on Base:
			   ```json
			   %s
			   ```
			""";

	private static final String SERVICES_PROMPT = """
			Available Services:
			1. Send payments
			   - Understand the user payment request and process it
			   - Aggregates multiple payments into single tool call
			   - Provide detailed response with payment details
			   - Recipient is mentioned user in current cast, otherwise fallback to parent cast author
			   - Input token and amount should be mention in current cast, if not fallback to parent cast author
			   - You can interpret approximate amounts (e.g., "few bucks" ≈ $5, "couple tokens" ≈ 2)
			   - Only process payments on Base network
			   - Don't request to check balance
			   - Use tool: send_payments

			   Valid Payment Commands:
			   - pay @user <amount> <token>
			   - send @user <amount> <token>
			   - transfer @user <amount> <token>

			   Examples:
			   - send @user1 @user2 @user3 100 USDC each
			   - split 100 USDC between @user1 @user2 @user3
			   - pay @user2 $5 ETH
			   - transfer @user3 50 degen

			2. Buy farcaster storage
			   - Buy farcaster storage for your account, mentioned user, or for parent cast author
			   - Use tool: buy_storage to reply with frame to make storage purchase

			3. Check token balance
			   - Check balance of particular token
			   - Use tool: get_wallet_token_balance to check and reply with token balance

			4. Top up balance
			   - Top up your Payflow Balance wallet with supported tokens, token is optional
			   - Use tool: top_up_balance to reply with frame to make top up
			""";

	private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

	private static final List<Tool> DEFAULT_TOOLS = List.of(
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
																	"amount", Tool.InputSchema.Property.builder()
																			.type("number")
																			.description("Amount in tokens")
																			.build(),
																	"dollars", Tool.InputSchema.Property.builder()
																			.type("number")
																			.description("Amount in USD")
																			.build(),
																	"token", Tool.InputSchema.Property.builder()
																			.type("string")
																			.description(
																					"Token identifier (e.g., USDC, ETH)")
																			.build()))
															.required(List.of("username", "token"))
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

		log.info("Anthropic API key: {}", anthropicApiKey);

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
					.temperature(0.5)
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
		Double temperature;
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
