package ua.sinaver.web3.payflow.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.victools.jsonschema.generator.OptionPreset;
import com.github.victools.jsonschema.generator.SchemaGenerator;
import com.github.victools.jsonschema.generator.SchemaGeneratorConfigBuilder;
import com.github.victools.jsonschema.generator.SchemaVersion;
import io.netty.channel.ChannelOption;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.util.retry.Retry;
import ua.sinaver.web3.payflow.config.AnthropicAgentPrompt;
import ua.sinaver.web3.payflow.message.Token;
import ua.sinaver.web3.payflow.message.agent.*;
import ua.sinaver.web3.payflow.message.farcaster.CastConversationData;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AnthropicAgentService {

	private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

	private static final List<AgentTool> DEFAULT_TOOLS = List.of(
			AgentTool.builder()
					.name("no_reply")
					.description("Use this when no response should be given")
					.inputSchema(
							AgentTool.InputSchema.builder()
									.type("object")
									.properties(Map.of(
											"reason", AgentTool.InputSchema.Property.builder()
													.type("string")
													.description("Reason for not replying")
													.build()))
									.required(List.of("reason"))
									.build())
					.build(),
			AgentTool.builder()
					.name("send_payments")
					.description("Send payment to one or more users")
					.inputSchema(
							AgentTool.InputSchema.builder()
									.type("object")
									.properties(Map.of(
											"recipients", AgentTool.InputSchema.Property.builder()
													.type("array")
													.description("List of payment recipients")
													.items(AgentTool.InputSchema.Items.builder()
															.type("object")
															.properties(Map.of(
																	"username", AgentTool.InputSchema.Property.builder()
																			.type("string")
																			.description("Recipient's username")
																			.build(),
																	"chainId", AgentTool.InputSchema.Property.builder()
																			.type("number")
																			.description(
																					"Chain ID, default is Base (8453)")
																			.build(),
																	"token", AgentTool.InputSchema.Property.builder()
																			.type("string")
																			.description(
																					"Token identifier (e.g., USDC, ETH)")
																			.build(),
																	"amount", AgentTool.InputSchema.Property.builder()
																			.type("number")
																			.description("Amount in tokens")
																			.build(),
																	"dollars", AgentTool.InputSchema.Property.builder()
																			.type("number")
																			.description("Amount in USD")
																			.build(),
																	"name", AgentTool.InputSchema.Property.builder()
																			.type("string")
																			.description(
																					"short name/description of the payment")
																			.build()))
															.required(List.of("username", "chainId", "token"))
															.build())
													.build()))
									.required(List.of("recipients"))
									.build())
					.build(),
			AgentTool.builder()
					.name("buy_storage")
					.description("Buy storage for your account, mentioned user, or for parent cast author")
					.inputSchema(
							AgentTool.InputSchema.builder()
									.type("object")
									.properties(Map.of(
											"fid", AgentTool.InputSchema.Property.builder()
													.type("number")
													.description("User fid to buy storage for")
													.build()))
									.required(List.of("fid"))
									.build())
					.build(),
			AgentTool.builder()
					.name("get_wallet_token_balance")
					.description("Get balance of particular token")
					.inputSchema(AgentTool.InputSchema.builder().type("object").properties(
							Map.of("token",
									AgentTool.InputSchema.Property.builder().type("string")
											.description("Token identifier like $token, token, or token address")
											.build()))
							.required(List.of("token")).build())
					.build(),
			AgentTool.builder()
					.name("top_up_wallet")
					.description("Top up your Payflow, Bank, or Rodeo wallets")
					.inputSchema(AgentTool.InputSchema.builder().type("object").properties(
							Map.of(
									"type",
									AgentTool.InputSchema.Property.builder().type("string")
											.description("Wallet type: payflow, bankr, or rodeo").build(),
									"token",
									AgentTool.InputSchema.Property.builder().type("string")
											.description("Token to top up")
											.build()))
							.required(List.of("type"))
							.build())
					.cacheControl(Map.of("type", "ephemeral"))
					.build(),
			AgentTool.builder()
					.name("pay_me")
					.description("Generate a payment link to accept payments")
					.inputSchema(
							AgentTool.InputSchema.builder()
									.type("object")
									.properties(Map.of(
											"userId", AgentTool.InputSchema.Property.builder()
													.type("string")
													.description("User ID requesting the payment")
													.build(),
											"token", AgentTool.InputSchema.Property.builder()
													.type("string")
													.description("Token identifier (e.g., USDC, ETH)")
													.build(),
											"chainId", AgentTool.InputSchema.Property.builder()
													.type("number")
													.description("Chain ID")
													.build(),
											"amount", AgentTool.InputSchema.Property.builder()
													.type("number")
													.description("Amount in tokens")
													.build(),
											"dollars", AgentTool.InputSchema.Property.builder()
													.type("number")
													.description("Amount in USD")
													.build(),
											"title", AgentTool.InputSchema.Property.builder()
													.type("string")
													.description("Title of the payment")
													.build()))
									.required(List.of("userId", "chainId", "token"))
									.build())
					.build(),
			AgentTool.builder()
					.name("claim_degen_or_moxie")
					.description("Claim Degen or Moxie")
					.inputSchema(AgentTool.InputSchema.builder().type("object").properties(Map.of(
							"asset", AgentTool.InputSchema.Property.builder().type("string")
									.description("Asset to claim")
									.build()))
							.required(List.of("asset")).build())
					.build());
	private final WebClient webClient;
	@Autowired
	private TokenService tokenService;
	@Autowired
	private ObjectMapper objectMapper;
	private List<AgentSystemMessage> systemPrompt;
	private List<AgentTool> tools;

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
						.responseTimeout(Duration.ofSeconds(60))
						.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000)))
				.build();
	}

	@PostConstruct
	private void initialize() {
		try {
			val tokenAddresses = tokenService.getTokens().stream()
					.collect(Collectors.groupingBy(
							Token::id,
							Collectors.mapping(
									token -> Map.of(
											"address",
											token.tokenAddress() != null ? token.tokenAddress()
													: TokenService.ZERO_ADDRESS,
											"chainId", String.valueOf(token.chainId())),
									Collectors.toList())));

			val schemaGeneratorConfig = new SchemaGeneratorConfigBuilder(
					SchemaVersion.DRAFT_2020_12,
					OptionPreset.PLAIN_JSON).build();

			val conversationSchemaPlainJson = objectMapper.writeValueAsString(
					new SchemaGenerator(schemaGeneratorConfig).generateSchema(CastConversationData.class));

			val tokenMapJson = objectMapper
					.writerWithDefaultPrettyPrinter()
					.writeValueAsString(tokenAddresses);

			this.systemPrompt = List.of(
					AgentSystemMessage.builder()
							.type("text")
							.text(AnthropicAgentPrompt.CORE_PROMPT.formatted(conversationSchemaPlainJson,
											tokenMapJson)
									.concat(AnthropicAgentPrompt.NO_REPLY_PROMPT)
									.concat(AnthropicAgentPrompt.SERVICES_PROMPT))
							.build());
			this.tools = DEFAULT_TOOLS;

			log.info("Initialized AnthropicAgentService with {} tokens", tokenAddresses.size());
		} catch (JsonProcessingException e) {
			log.error("Failed to serialize tokens to JSON", e);
			throw new RuntimeException("Failed to initialize system prompt", e);
		}
	}

	public AgentResponse processPaymentInput(List<AgentMessage> messages) {
		try {
			val request = AgentRequest.builder()
					.model("claude-3-5-haiku-20241022")
					.maxTokens(4096)
					.temperature(0.85)
					.tools(tools)
					.system(systemPrompt)
					.messages(messages)
					.build();

			log.info("Anthropic API request: {}",
					objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(request));

			val response = webClient.post()
					.bodyValue(request)
					.retrieve()
					.onStatus(status -> status.equals(HttpStatus.BAD_REQUEST),
							clientResponse -> clientResponse.bodyToMono(String.class)
									.flatMap(errorBody -> {
										log.error("Anthropic API request failed: {}", errorBody);
										return Mono.error(new RuntimeException("Anthropic API error: " + errorBody));
									}))
					.bodyToMono(AgentResponse.class)
					.retryWhen(Retry.backoff(3, Duration.ofSeconds(3))
							.maxBackoff(Duration.ofSeconds(15))
							.doBeforeRetry(signal -> log.warn("Retry attempt {} after error: {}",
									signal.totalRetries() + 1,
									signal.failure().getMessage())))
					.block();

			log.info("Anthropic API response: {}", response);

			return response;
		} catch (Exception e) {
			log.error("Failed to process input: {}", messages, e);
		}

		return null;
	}
}
