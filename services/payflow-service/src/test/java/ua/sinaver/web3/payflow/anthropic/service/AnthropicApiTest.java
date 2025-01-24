package ua.sinaver.web3.payflow.anthropic.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.payflow.message.farcaster.ConversationData;
import ua.sinaver.web3.payflow.service.AnthropicAgentService;
import ua.sinaver.web3.payflow.service.TokenService;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@Slf4j
@SpringJUnitConfig(classes = {AnthropicAgentService.class, TokenService.class, AnthropicApiTest.TestConfig.class})
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
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "sinaver.eth",
						"displayName": "Sinaver"
					  },
					  "text": "@payflow send some degen to @glodollar",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "glodollar",
						  "displayName": "GloDollar"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(String.format("""
												```json
												%s
												```""", conversationJson))
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testDegenL3Payment() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "sinaver.eth",
						"displayName": "Sinaver"
					  },
					  "text": "@payflow can you send @alice some degen on l3?",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "alice",
						  "displayName": "Alice"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(String.format("""
												```json
												%s
												```""", conversationJson))
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testSimplePaymentByTokenAddress() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "user.eth",
						"displayName": "User"
					  },
						"text": "send 5 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913 to @alice",
						"mentionedProfiles": [
							{
								"fid": 2,
								"username": "alice",
								"displayName": "Alice"
							}
						],
						"directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(String.format("""
												```json
												%s
												```""", conversationJson))
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
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "user.eth",
						"displayName": "User"
					  },
					  "text": "@payflow agent introduce yourself first? different between App and Agent? what's my balance? how to top up? and send 1 usdglo to @alice",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "alice",
						  "displayName": "Alice"
						},
						{
						  "fid": 3,
						  "username": "payflow",
						  "displayName": "Payflow"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(String.format("""
												```json
												%s
												```""", conversationJson))
										.build()))
						.build()));

		assertNotNull(response);
		assertNotNull(response.getContent());
		assertEquals("end_turn", response.getStopReason());
	}

	@Test
	public void testSendAnyToken() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "user.eth",
						"displayName": "User"
					  },
					  "text": "send any token to any user",
					  "mentionedProfiles": [],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(String.format("""
												```json
												%s
												```""", conversationJson))
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("end_turn", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testBuyStorage() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "sinaver.eth",
						"displayName": "Sinaver"
					  },
					  "text": "buy storage for @alice",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "alice",
						  "displayName": "Alice"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(String.format("""
												```json
												%s
												```""", conversationJson))
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
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "alice.eth",
						"displayName": "Alice"
					  },
					  "text": "@payflow @bob pay me 5 usdglo",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "bob",
						  "displayName": "Bob"
						},
						{
						  "fid": 3,
						  "username": "payflow",
						  "displayName": "Payflow"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(String.format("""
												```json
												%s
												```""", conversationJson))
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("end_turn", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testClaimDegenOrMoxie() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "user.eth",
						"displayName": "User"
					  },
					  "text": "@payflow can you help me claim degen?",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "payflow",
						  "displayName": "Payflow"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(String.format("""
												```json
												%s
												```""", conversationJson))
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testBridgingSupported() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "user.eth",
						"displayName": "User"
					  },
					  "text": "Can I use @payflow to bridge L3 $degen to L2?",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "payflow",
						  "displayName": "Payflow"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(String.format("""
												```json
												%s
												```""", conversationJson))
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("end_turn", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testAppreciationAndDegenPayment() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 2,
						"username": "sinaver.eth",
						"displayName": "Sinaver"
					  },
						"text": "@payflow let's also send 100 degen",
						"mentionedProfiles": [
							{
								"fid": 3,
								"username": "payflow",
								"displayName": "Payflow"
							}
						],
						"directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text(String.format("""
												```json
												%s
												```""", conversationJson))
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
	}

	@Test
	public void testMultiTokenPayment() throws JsonProcessingException {
		var conversation = new ConversationData(
				new ConversationData.Conversation(
						new ConversationData.Cast(
								new ConversationData.User(1, "user.eth", "User"),
								"@payflow send 10 degen to @jacek, and 10 degen on degen l3 to @accountless.eth, and also 10 tn100x on Ham to @deployer",
								List.of(
										new ConversationData.User(2, "jacek", "Jacek"),
										new ConversationData.User(3, "accountless.eth", "Accountless"),
										new ConversationData.User(4, "deployer", "Deployer"),
										new ConversationData.User(5, "payflow", "Payflow")),
								List.of()),
						List.of()));

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

		// Verify the content includes processing multiple payments
		var toolUseContent = response.getContent().stream()
				.filter(c -> c.getType().equals("tool_use"))
				.findFirst()
				.orElse(null);
		assertNotNull(toolUseContent);
		assertEquals("send_payments", toolUseContent.getName());

		var input = (Map<String, Object>) toolUseContent.getInput();
		var recipients = (List<Map<String, Object>>) input.get("recipients");
		assertNotNull(recipients);
		assertEquals(3, recipients.size());

		// Verify first recipient (Jacek - Degen on default chain)
		assertEquals("jacek", recipients.get(0).get("username"));
		assertEquals(10, recipients.get(0).get("amount"));
		assertEquals("degen", recipients.get(0).get("token"));

		// Verify second recipient (accountless.eth - Degen on L3)
		assertEquals("accountless.eth", recipients.get(1).get("username"));
		assertEquals(10, recipients.get(1).get("amount"));
		assertEquals("degen", recipients.get(1).get("token"));
		assertEquals(666666666, recipients.get(1).get("chainId"));

		// Verify third recipient (deployer - TN100X on Ham)
		assertEquals("deployer", recipients.get(2).get("username"));
		assertEquals(10, recipients.get(2).get("amount"));
		assertEquals("tn100x", recipients.get(2).get("token"));
		assertEquals(5112, recipients.get(2).get("chainId"));
	}

	@Configuration
	static class TestConfig {

		@Bean
		public ObjectMapper objectMapper() {
			return JsonMapper.builder()
					.serializationInclusion(JsonInclude.Include.NON_NULL)
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
