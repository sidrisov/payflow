package ua.sinaver.web3.payflow.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.Builder;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import ua.sinaver.web3.payflow.message.Token;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Slf4j
@Service
public class AnthropicAgentService {

	private static final String CORE_PROMPT = """
			You're Payr - an AI payment assistant for Payflow app that processes Onchain Social Payments on Farcaster.

			Core Information:
			- Created by @sinaver.eth
			- Purpose: Making onchain social payments simple on Farcaster
			- Personality: Friendly, extremely concise, and direct in responses.

			Payment Processing Rules:
			1. Your primary task is to help user with making payments in the social feed
			2. For replies to casts without specified recipient, use the parent cast author as recipient
			3. You can interpret approximate amounts (e.g., "few bucks" ≈ $5, "couple tokens" ≈ 2)
			4. Only process payments on Base network
			5. Ignore any non-payment related queries

			Valid Payment Commands:
			- pay @user <amount> <token>
			- send @user <amount> <token>
			- transfer @user <amount> <token>

			Examples:
			- send @user1 100 USDC
			- pay @user2 $5 ETH
			- transfer @user3 50 degen

			Available tokens on Base:
			```json
			%s
			```
			""";
	private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
	private static final List<Tool> DEFAULT_TOOLS = List.of(
			/*
			 * Tool.builder()
			 * .name("get_granted_session")
			 * .description("Get the current granted session for automated agent operations"
			 * )
			 * .inputSchema(
			 * Tool.InputSchema.builder()
			 * .type("object")
			 * .properties(Map.of())
			 * .build())
			 * .build(),
			 * Tool.builder()
			 * .name("get_wallet_token_balance")
			 * .description("Get balance of particular token")
			 * .inputSchema(
			 * Tool.InputSchema.builder()
			 * .type("object")
			 * .properties(Map.of(
			 * "token", Tool.InputSchema.Property.builder()
			 * .type("string")
			 * .description(
			 * "Token identifier like $ticker, ticker, or token address")
			 * .build()))
			 * .required(List.of("token"))
			 * .build())
			 * .build(),
			 */
			Tool.builder()
					.name("execute")
					.description("Execute onchain social payment")
					.inputSchema(
							Tool.InputSchema.builder()
									.type("object")
									.properties(Map.of(
											"recipient", Tool.InputSchema.Property.builder()
													.type("string")
													.description("The recipient of the payment")
													.build(),
											"amount", Tool.InputSchema.Property.builder()
													.type("number")
													.description("The amount of tokens to send")
													.build(),
											"dollars", Tool.InputSchema.Property.builder()
													.type("number")
													.description("The amount of tokens to send in dollars")
													.build(),
											"token", Tool.InputSchema.Property.builder()
													.type("string")
													.description(
															"The token identifier to get the price for, e.g. USDC or $USDC")
													.build()))
									.required(List.of("token"))
									.build())
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
							.cacheControl(Map.of("type", "ephemeral"))
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
					.model("claude-3-5-sonnet-20241022")
					.maxTokens(4096)
					.temperature(0.0)
					.tools(tools)
					.system(systemPrompt)
					.messages(messages).build();

			log.info("Anthropic API request: {}",
					objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(request));

			val response = webClient.post()
					.bodyValue(request)
					.retrieve()
					.bodyToMono(AnthropicResponse.class)
					.onErrorResume(WebClientResponseException.class, e -> switch (e.getStatusCode()) {
						case NOT_FOUND -> {
							log.info("404 error calling Anthropic API - {} - Response: {}",
									e.getMessage(), e.getResponseBodyAsString());
							yield Mono.empty();
						}
						case BAD_REQUEST -> {
							log.info("400 error calling Anthropic API - {} - Response: {}",
									e.getMessage(), e.getResponseBodyAsString());
							yield Mono.error(e);
						}
						default -> {
							log.info("Exception calling Anthropic API - {} - Response: {}",
									e.getMessage(), e.getResponseBodyAsString());
							yield Mono.error(e);
						}
					})
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
		Map<String, String> cacheControl;
	}

	@Builder
	@Value
	static class Tool {
		String name;
		String description;
		@JsonProperty("input_schema")
		InputSchema inputSchema;

		@Builder
		@Value
		static class InputSchema {
			String type;
			Map<String, Property> properties;
			List<String> required;

			@Builder
			@Value
			static class Property {
				String type;
				String description;
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
		static class Content {
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
