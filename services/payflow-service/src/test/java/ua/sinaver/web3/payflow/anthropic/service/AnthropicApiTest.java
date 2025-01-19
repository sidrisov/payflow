package ua.sinaver.web3.payflow.anthropic.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import lombok.extern.slf4j.Slf4j;
import lombok.val;

import org.jetbrains.annotations.TestOnly;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.payflow.message.farcaster.Conversation;
import ua.sinaver.web3.payflow.service.AnthropicAgentService;
import ua.sinaver.web3.payflow.service.TokenService;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@Slf4j
@SpringJUnitConfig(classes = { AnthropicAgentService.class, TokenService.class, AnthropicApiTest.TestConfig.class })
@TestPropertySource(locations = "classpath:application.properties")
public class AnthropicApiTest {

	@Value("${anthropic.api.key}")
	private String anthropicApiKey;
	@Autowired
	private AnthropicAgentService anthropicAgentService;
	@Autowired
	private ObjectMapper objectMapper;

	@Test
	public void testSimplePayment() throws JsonProcessingException {
		var conversation = new Conversation(
				new Conversation.ConversationData(
						new Conversation.CastMessage(
								new Conversation.User("sinaver.eth", 1),
								"@payflow let's try again, I topped up :) now, transfer 1 usdglo to @glodollar",
								List.of(new Conversation.User("glodollar", 2))),
						new Conversation.CastMessage(
								new Conversation.User("sinaver.eth", 2),
								"@payflow split 1 usdglo between @glodollar and @lanadingwall",
								List.of(new Conversation.User("glodollar", 3),
										new Conversation.User("lanadingwall", 4)))));

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(String.format("""
												```json
												%s
												```""", objectMapper.writeValueAsString(conversation)))
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testDegenL3Payment() throws JsonProcessingException {
		var conversation = new Conversation(
				new Conversation.ConversationData(
						null,
						new Conversation.CastMessage(
								new Conversation.User("sinaver.eth", 1),
								"@payflow can you send @alice some degen on l3?",
								List.of(new Conversation.User("alice", 2)))));

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(String.format("""
												```json
												%s
												```""", objectMapper.writeValueAsString(conversation)))
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Disabled
	public void testSimplePaymentByTokenAddress() throws JsonProcessingException {
		var conversation = new Conversation(
				new Conversation.ConversationData(
						null,
						new Conversation.CastMessage(
								new Conversation.User("user.eth", 1),
								"send 5 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913 to @alice",
								List.of(new Conversation.User("alice", 2)))));

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(objectMapper.writeValueAsString(conversation))
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());
		var toolUseContent = response.getContent().stream()
				.filter(c -> c.getType().equals("tool_use"))
				.findFirst()
				.orElse(null);
		assertNotNull(toolUseContent);
		assertEquals("send_payment", toolUseContent.getText());
	}

	@Test
	public void testWhoAreYou() throws JsonProcessingException {
		var conversation = new Conversation(
				new Conversation.ConversationData(
						null,
						new Conversation.CastMessage(
								new Conversation.User("user.eth", 1),
								"""
										@payflow agent introduce yourself first? different between App and Agent? what's my balance? how to top up? and send 1 usdglo to @alice
										""",
								List.of(new Conversation.User("alice", 2),
										new Conversation.User("payflow", 3)))));

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(objectMapper.writeValueAsString(conversation))
										.build()))
						.build()));

		assertNotNull(response);
		assertNotNull(response.getContent());
		assertEquals("end_turn", response.getStopReason());
	}

	@Disabled
	public void testSendAnyToken() throws JsonProcessingException {
		var conversation = new Conversation(
				new Conversation.ConversationData(
						null,
						new Conversation.CastMessage(
								new Conversation.User("user.eth", 1),
								"send any token to any user",
								List.of())));

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(objectMapper.writeValueAsString(conversation))
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("end_turn", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Disabled
	public void testBuyStorage() throws JsonProcessingException {

		var conversation = new Conversation(
				new Conversation.ConversationData(
						null,
						new Conversation.CastMessage(
								new Conversation.User("sinaver.eth", 1),
								"buy storage for @alice",
								List.of(new Conversation.User("alice", 2)))));

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(AnthropicAgentService.Message.Content.builder().type("text")
								.text(String.format("""
										```json
										%s
										```""", objectMapper.writeValueAsString(conversation)))
								.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());

		var toolUseContent = response.getContent().stream()
				.filter(c -> c.getType().equals("tool_use"))
				.findFirst()
				.orElse(null);

		assertNotNull(toolUseContent);
		assertEquals("buy_storage", toolUseContent.getName());

		val input = (Map<String, Object>) toolUseContent.getInput();
		val fid = ((Integer) input.get("fid"));
		assertEquals(2, fid);
	}

	@Test
	public void testPayMe() throws JsonProcessingException {
		var conversation = new Conversation(
				new Conversation.ConversationData(
						null,
						new Conversation.CastMessage(
								new Conversation.User("alice.eth", 1),
								"@payflow @bob pay me 5 usdglo",
								List.of(new Conversation.User("bob", 2),
										new Conversation.User("payflow", 3)))));

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(objectMapper.writeValueAsString(conversation))
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("end_turn", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testClaimDegenOrMoxie() throws JsonProcessingException {
		var conversation = new Conversation(
				new Conversation.ConversationData(null,
						new Conversation.CastMessage(new Conversation.User("user.eth", 1),
								"@payflow can you help me claim degen?",
								List.of(new Conversation.User("payflow", 2)))));

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(objectMapper.writeValueAsString(conversation))
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testBridingSupported() throws JsonProcessingException {
		var conversation = new Conversation(
				new Conversation.ConversationData(null,
						new Conversation.CastMessage(new Conversation.User("user.eth", 1),
								"Can I use @payflow to bridge L3 $degen to L2?",
								List.of(new Conversation.User("payflow", 2)))));

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(AnthropicAgentService.Message.Content.builder().type("text")
								.text(objectMapper.writeValueAsString(conversation)).build()))
						.build()));

		assertNotNull(response);
		assertEquals("end_turn", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testAppreciationAndDegenPayment() throws JsonProcessingException {
		var conversation = new Conversation(
				new Conversation.ConversationData(
						new Conversation.CastMessage(
								new Conversation.User("dusan.framedl.eth", 1),
								"appreciate the support 🫡",
								List.of()),
						new Conversation.CastMessage(
								new Conversation.User("sinaver.eth", 2),
								"@payflow let's also send 100 degen",
								List.of(new Conversation.User("payflow", 3)))));

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(objectMapper.writeValueAsString(conversation))
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());

		// Verify the content includes processing the degen payment
		var toolUseContent = response.getContent().stream()
				.filter(c -> c.getType().equals("tool_use"))
				.findFirst()
				.orElse(null);
		assertNotNull(toolUseContent);
	}

	@Configuration
	static class TestConfig {

		@Bean
		public ObjectMapper objectMapper() {
			return JsonMapper.builder()
					.serializationInclusion(JsonInclude.Include.NON_NULL)
					.configure(SerializationFeature.INDENT_OUTPUT, true)
					.build();
		}

		@Bean
		public WebClient.Builder webClientBuilder(ObjectMapper objectMapper) {
			return WebClient.builder()
					.codecs(configurer -> configurer.defaultCodecs()
							.jackson2JsonEncoder(new Jackson2JsonEncoder(objectMapper)));
		}

	}
}
