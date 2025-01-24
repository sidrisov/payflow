package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
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
				.onStatus(HttpStatus.NOT_FOUND::equals, clientResponse -> {
					log.error("404 error when calling Glide API by sessionId {}", sessionId);
					return Mono.error(new RuntimeException("Session not found"));
				})
				.bodyToMono(GlideSessionResponse.class)
				.onErrorResume(error -> {
					log.error("Error fetching session info for sessionId: {}", sessionId, error);
					return Mono.justOrEmpty((GlideSessionResponse) null);
				})
				.doOnSuccess(response -> {
					if (response != null) {
						log.debug("Fetched session info for sessionId: {}", sessionId);
					} else {
						log.debug("Session not found for sessionId: {}", sessionId);
					}
				})
				.doOnError(error -> log.error("Error fetching session info for sessionId: {}", sessionId, error));
	}
}
