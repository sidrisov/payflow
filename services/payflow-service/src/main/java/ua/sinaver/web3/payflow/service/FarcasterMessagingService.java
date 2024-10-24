package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastResponse;
import ua.sinaver.web3.payflow.service.api.IFarcasterMessagingService;

@Slf4j
@Service
public class FarcasterMessagingService implements IFarcasterMessagingService {

	private final WebClient webClient;

	public FarcasterMessagingService(WebClient.Builder builder, @Value("${payflow.farcaster.bot" +
			".messaging.secret}") String messagingBotSecret) {
		webClient = builder.baseUrl("https://api.warpcast.com")
				.defaultHeader("Authorization", "Bearer " + messagingBotSecret)
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.build();
	}

	@Override
	public DirectCastResponse sendMessage(DirectCastMessage message) {
		log.debug("Sending direct cast message: {}", message);

		try {
			val response = webClient.put()
					.uri("/v2/ext-send-direct-cast")
					.bodyValue(message)
					.retrieve().bodyToMono(DirectCastResponse.class).block();
			log.debug("Direct cast message response: {}", response);
			return response;
		} catch (Throwable t) {
			log.debug("Exception sending direct cast message {} - {}",
					message, t.getMessage());
			throw t;
		}
	}

	@Async
	@Override
	public void sendMessageAsync(DirectCastMessage message) {
		log.debug("Sending direct cast message asynchronously: {}", message);
		sendMessage(message);
	}
}