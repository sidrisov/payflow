package ua.sinaver.web3.payflow.service;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.payflow.message.CryptoPrice;
import ua.sinaver.web3.payflow.message.Token;
import ua.sinaver.web3.payflow.message.TokenPriceResponse;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TokenPriceService {

	private final WebClient coinGeckoWebClient;
	private final WebClient geckoTerminalWebClient;
	@Getter
	private final Map<String, Double> prices = new HashMap<>();
	@Autowired
	private TokenService tokenService;

	public TokenPriceService(WebClient.Builder webClientBuilder) {
		coinGeckoWebClient = webClientBuilder.baseUrl("https://api.coingecko.com/api/v3").build();
		geckoTerminalWebClient = webClientBuilder.baseUrl("https://api.geckoterminal.com/api/v2").build();

	}

	@Scheduled(initialDelay = 0, fixedRate = 60 * 1000)
	public void fetchPrices() {
		val ethereum = "ethereum";
		try {
			val response = coinGeckoWebClient.get()
					.uri(String.format("/simple/price?ids=%s&vs_currencies=usd", ethereum))
					.retrieve()
					.bodyToMono(new ParameterizedTypeReference<Map<String, CryptoPrice>>() {
					})
					.block();

			if (response != null && response.containsKey(ethereum)) {
				this.prices.put("eth", response.get(ethereum).usd());
			}
		} catch (Throwable t) {
			log.error("Failed to fetch ethereum price {} - {}", t.getMessage(),
					log.isTraceEnabled() ? t : null);
		}

		val tokens = tokenService.getTokens();
		// Fetch token prices for supported chains
		for (val chainId : tokens.stream()
				.map(Token::chainId).distinct().toList()) {

			try {
				val tokensForChain = tokens.stream()
						.filter(token -> token.chainId().equals(chainId) && token.tokenAddress() != null)
						.toList();

				val tokensToFetch = tokensForChain.stream()
						.filter(token -> !prices.containsKey(token.id()))
						.toList();

				if (tokensToFetch.isEmpty()) {
					continue;
				}

				val chainName = tokensToFetch.getFirst().chain();
				val apiUrl = String.format("/simple/networks/%s/token_price/%s",
						chainId.equals(TokenService.DEGEN_CHAIN_ID) ? "degenchain" : chainName,
						tokensToFetch.stream()
								.map(token -> token.underlyingToken() != null ?
										token.underlyingToken().tokenAddress() :
										token.tokenAddress())
								.collect(Collectors.joining(",")));

				log.debug("API: {}", apiUrl);

				val tokenPriceResponse = geckoTerminalWebClient.get()
						.uri(apiUrl)
						.retrieve()
						.bodyToMono(TokenPriceResponse.class)
						.block();

				log.debug("{}", tokenPriceResponse);

				if (tokenPriceResponse != null) {
					val tokenPrices = tokenPriceResponse.data().attributes().tokenPrices();

					tokensForChain.forEach(token -> {
						val tokenAddress = token.underlyingToken() != null ?
								token.underlyingToken().tokenAddress() : token.tokenAddress();
						if (tokenPrices.containsKey(tokenAddress)) {
							prices.put(token.id(), Double.parseDouble(tokenPrices.get(tokenAddress)));
						}
					});
				}
			} catch (Throwable t) {
				log.error("Failed to fetch prices for chain: {} - {} - {}", chainId, t.getMessage(),
						log.isTraceEnabled() ? t : null);
			}
		}

		log.debug("Prices: {}", prices);
	}
}
