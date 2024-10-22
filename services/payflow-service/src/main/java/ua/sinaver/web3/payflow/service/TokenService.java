package ua.sinaver.web3.payflow.service;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.message.Token;

import java.io.IOException;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class TokenService {

	public static final String BASE_CHAIN_NAME = "base";
	public static final Integer BASE_CHAIN_ID = 8453;
	public static final Integer DEFAULT_FRAME_PAYMENTS_CHAIN_ID = BASE_CHAIN_ID;
	public static final String OP_CHAIN_NAME = "optimism";
	public static final Integer OP_CHAIN_ID = 10;
	public static final String ZORA_CHAIN_NAME = "zora";
	public static final Integer ZORA_CHAIN_ID = 7777777;
	public static final String DEGEN_CHAIN_NAME = "degen";
	public static final Integer DEGEN_CHAIN_ID = 666666666;
	public static final String ARB_CHAIN_NAME = "arbitrum";
	public static final Integer ARB_CHAIN_ID = 42161;
	public static final String MODE_CHAIN_NAME = "mode";
	public static final Integer MODE_CHAIN_ID = 34443;
	public static final String WORLD_CHAIN_NAME = "world";
	public static final Integer WORLD_CHAIN_ID = 480;
	public static final Map<Integer, String> PAYMENT_CHAIN_NAMES = Map.of(
			BASE_CHAIN_ID, BASE_CHAIN_NAME,
			OP_CHAIN_ID, OP_CHAIN_NAME,
			ZORA_CHAIN_ID, ZORA_CHAIN_NAME,
			DEGEN_CHAIN_ID, DEGEN_CHAIN_NAME,
			ARB_CHAIN_ID, ARB_CHAIN_NAME,
			MODE_CHAIN_ID, MODE_CHAIN_NAME,
			WORLD_CHAIN_ID, WORLD_CHAIN_NAME);
	public static final Map<String, Integer> PAYMENT_CHAIN_IDS = Map.of(
			BASE_CHAIN_NAME, BASE_CHAIN_ID,
			OP_CHAIN_NAME, OP_CHAIN_ID,
			ZORA_CHAIN_NAME, ZORA_CHAIN_ID,
			DEGEN_CHAIN_NAME, DEGEN_CHAIN_ID,
			ARB_CHAIN_NAME, ARB_CHAIN_ID,
			MODE_CHAIN_NAME, MODE_CHAIN_ID,
			WORLD_CHAIN_NAME, WORLD_CHAIN_ID);
	public static final List<Integer> SUPPORTED_FRAME_PAYMENTS_CHAIN_IDS =
			Arrays.asList(BASE_CHAIN_ID, OP_CHAIN_ID, ZORA_CHAIN_ID, DEGEN_CHAIN_ID, ARB_CHAIN_ID,
					MODE_CHAIN_ID, WORLD_CHAIN_ID);
	public static final String ETH_TOKEN = "eth";
	public static final String USDC_TOKEN = "usdc";
	public static final List<String> PAYMENTS_OP_TOKENS = Arrays.asList(ETH_TOKEN, USDC_TOKEN);
	public static final String DEGEN_TOKEN = "degen";
	public static final List<String> SUPPORTED_FRAME_PAYMENTS_TOKENS = Arrays.asList(ETH_TOKEN, USDC_TOKEN,
			DEGEN_TOKEN, "higher", "build", "onchain", "tn100x", "przUSDC");
	public static final List<String> PAYMENTS_DEGEN_TOKENS = List.of(DEGEN_TOKEN);
	public static final List<String> PAYMENTS_BASE_TOKENS = Arrays.asList(ETH_TOKEN, USDC_TOKEN, DEGEN_TOKEN);
	public static final Map<Integer, List<String>> PAYMENTS_CHAIN_TOKENS = Map.of(BASE_CHAIN_ID,
			PAYMENTS_BASE_TOKENS, OP_CHAIN_ID, PAYMENTS_OP_TOKENS, DEGEN_CHAIN_ID,
			PAYMENTS_DEGEN_TOKENS);
	public static final String ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

	@Value("classpath:tokens.json")
	private Resource tokensResource;

	@Getter
	private List<Token> tokens;

	@PostConstruct
	public void init() throws IOException {
		try (InputStreamReader reader = new InputStreamReader(tokensResource.getInputStream())) {
			Type tokenListType = new TypeToken<List<Token>>() {
			}.getType();
			tokens = new Gson().fromJson(reader, tokenListType);
			log.debug("Supported Tokens: {}", tokens);
		}
	}
}