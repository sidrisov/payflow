package ua.sinaver.web3.payflow.anthropic.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
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

import ua.sinaver.web3.payflow.client.WalletClient;
import ua.sinaver.web3.payflow.service.WalletService;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static ua.sinaver.web3.payflow.service.TokenService.ZERO_ADDRESS;

@Disabled
@Slf4j
@SpringJUnitConfig(classes = { WalletService.class, WalletClient.class, WalletServiceTest.TestConfig.class })
@TestPropertySource(locations = "classpath:application.properties")
public class WalletServiceTest {

	@Value("${anthropic.api.key}")
	private String anthropicApiKey;
	@Autowired
	private WalletService walletService;

	@Test
	public void testTokenBalance() throws JsonProcessingException {
		val token = walletService.getTokenBalance(ZERO_ADDRESS, 8453, null);

		log.info("Token {}", token);
		assertNotNull(token);
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
