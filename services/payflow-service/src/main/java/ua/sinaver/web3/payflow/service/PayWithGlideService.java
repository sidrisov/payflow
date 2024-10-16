package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import ua.sinaver.web3.payflow.message.glide.GlideSessionResponse;

@Service
@Slf4j
public class PayWithGlideService {
	private final WebClient webClient;

	public PayWithGlideService(
			@Value("${payflow.glide.api.url}") String glideApiUrl,
			@Value("${payflow.glide.api.key}") String apiKey) {
		this.webClient = WebClient.builder()
				.baseUrl(glideApiUrl)
				.defaultHeader("x-glide-project-id", apiKey)
				.build();
	}

	public Mono<GlideSessionResponse> getSessionInfo(String sessionId) {
		return webClient.get()
				.uri("/sessions/{sessionId}", sessionId)
				.retrieve()
				.bodyToMono(GlideSessionResponse.class)
				.switchIfEmpty(Mono.error(new RuntimeException("Session not found")))
				.doOnSuccess(response -> log.debug("Fetched session info for sessionId: {}", sessionId))
				.doOnError(error -> log.error("Error fetching session info for sessionId: {}", sessionId, error));
	}
}
