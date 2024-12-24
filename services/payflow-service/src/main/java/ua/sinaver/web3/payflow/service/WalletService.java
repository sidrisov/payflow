package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.payflow.message.WalletMessage;

import java.util.List;

@Service
@Slf4j
public class WalletService {

	private final WebClient webClient;

	public WalletService(WebClient.Builder builder,
	                     @Value("${payflow.onchain.url}") String walletApiUrl) {
		webClient = builder.baseUrl(walletApiUrl)
				.baseUrl("/api/wallet")
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.build();
	}

	public static String shortenWalletAddressLabel(String walletAddress) {
		if (walletAddress != null && !walletAddress.isEmpty()) {
			return walletAddress.substring(0, 5) + "..." + walletAddress.substring(walletAddress.length() - 3);
		} else {
			return "";
		}
	}

	public static String shortenWalletAddressLabel2(String walletAddress) {
		if (walletAddress != null && !walletAddress.isEmpty()) {
			return walletAddress.substring(0, 6) + "..." + walletAddress.substring(walletAddress.length() - 4);
		} else {
			return "";
		}
	}

	public List<WalletMessage> calculateWallets(List<String> owners, String saltNonce) {
		val wallets = webClient.get()
				.uri(uriBuilder -> uriBuilder.path("/generate")
						.queryParam("owners", owners.toArray())
						.queryParam("nonce", saltNonce)
						.build())
				.retrieve()
				.bodyToFlux(WalletMessage.class)
				.collectList()
				.block();

		log.debug("Wallets: {}", wallets);
		return wallets;
	}
}
