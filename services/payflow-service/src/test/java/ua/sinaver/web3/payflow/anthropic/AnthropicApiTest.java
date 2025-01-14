package ua.sinaver.web3.payflow.anthropic;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.payflow.service.AnthropicAgentService;
import ua.sinaver.web3.payflow.service.TokenService;

import java.util.List;

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

	@Test
	public void testSimplePayment() {
		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text("""
												parent cast: @pembe: hello hello
														""")
										.build()))
						.build(),
						AnthropicAgentService.Message.builder()
								.role("user")
								.content(List.of(
										AnthropicAgentService.Message.Content.builder()
												.type("text")
												.text("""
														cast: @sinaver.eth: pay some degen
																""")
												.build()))
								.build()));

		log.info("Anthropic API response: {}", response);

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Disabled
	public void testSimplePaymentByTokenAddress() {
		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text("send 5 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913 to @alice")
										.build()))
						.build()));

		log.info("Anthropic API response: {}", response);

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Disabled
	public void testWhoAreYou() {
		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text("who are you and what do you do?")
										.build()))
						.build()));

		log.info("Anthropic API response: {}", response);

		assertNotNull(response);
		assertNotNull(response.getContent());
		assertEquals("end_turn", response.getStopReason());
	}

	@Disabled
	public void testSendAnyToken() {
		val response = anthropicAgentService.processPaymentInput(
				List.of(AnthropicAgentService.Message.builder()
						.role("user")
						.content(List.of(
								AnthropicAgentService.Message.Content.builder()
										.type("text")
										.text("send any token to any user")
										.build()))
						.build()));

		log.info("Anthropic API response: {}", response);

		assertNotNull(response);
		assertEquals("end_turn", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Configuration
	static class TestConfig {
		@Bean
		public WebClient.Builder webClientBuilder() {
			return WebClient.builder();
		}

		@Bean
		public ObjectMapper objectMapper() {
			return JsonMapper.builder()
					.serializationInclusion(JsonInclude.Include.NON_NULL)
					.configure(SerializationFeature.INDENT_OUTPUT, true)
					.build();
		}
	}
}
