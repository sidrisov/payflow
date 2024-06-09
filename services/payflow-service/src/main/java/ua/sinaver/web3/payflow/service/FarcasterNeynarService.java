package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import ua.sinaver.web3.payflow.message.*;
import ua.sinaver.web3.payflow.message.subscription.SubscribersMessage;
import ua.sinaver.web3.payflow.message.subscription.SubscriptionsCreatedMessage;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
public class FarcasterNeynarService implements IFarcasterNeynarService {

	private final WebClient neynarClient;

	public FarcasterNeynarService(WebClient.Builder builder,
	                              @Value("${payflow.hub.api.key}") String hubApiKey) {
		neynarClient = builder.baseUrl("https://api.neynar.com/v2/farcaster")
				.defaultHeader("api_key", hubApiKey)
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.build();
	}

	@Override
	@Retryable
	public ValidatedFarcasterFrameMessage validateFrameMessageWithNeynar(String frameMessageInHex) {
		log.debug("Calling Neynar Frame Validate API for message {}",
				frameMessageInHex);
		try {
			return neynarClient.post()
					.uri("/frame/validate")
					.bodyValue(new ValidateMessageRequest(false, false, true, frameMessageInHex))
					.retrieve().bodyToMono(ValidatedFarcasterFrameMessage.class).block();
		} catch (Throwable t) {
			log.debug("Exception calling Neynar Frame Validate API: {}", t.getMessage());
			throw t;
		}
	}

	@Override
	public CastResponseMessage cast(String signer, String message, String parentHash,
	                                List<CastEmbed> embeds) {
		log.debug("Calling Neynar Cast API with message {}",
				message);
		try {
			val response = neynarClient.post()
					.uri("/cast")
					.bodyValue(new CastRequestMessage(signer, message, parentHash,
							embeds))
					.retrieve().bodyToMono(CastResponseMessage.class).block();
			log.debug("Cast response: {}", response);
			return response;
		} catch (Throwable t) {
			log.debug("Exception calling Neynar Cast API with message {} - {}",
					message, t.getMessage());
			throw t;
		}
	}

	@Override
	public CastMessage fetchCastByHash(String hash) {
		log.debug("Calling Neynar Cast API to fetch by hash {}", hash);
		try {
			val response = neynarClient.get()
					.uri(uriBuilder -> uriBuilder.path("/cast")
							.queryParam("type", "hash")
							.queryParam("identifier", hash)
							.build())
					.retrieve().bodyToMono(CastMessageResponse.class).block();
			return response != null ? response.cast() : null;
		} catch (Throwable t) {
			log.debug("Exception calling Neynar Cast API to fetch by hash {} - {}",
					hash, t.getMessage());
			throw t;
		}
	}

	@Override
	public List<SubscriptionsCreatedMessage.Subscription> subscriptionsCreated(int fid) {
		log.debug("Calling Neynar Created Subscriptions API by fid {}", fid);
		return neynarClient.get()
				.uri(uriBuilder -> uriBuilder.path("/user/subscriptions_created")
						.queryParam("fid", fid == 19129 ? 576 : fid)
						.queryParam("subscription_provider", "fabric_stp")
						.build())
				.retrieve()
				.onStatus(HttpStatus.NOT_FOUND::equals, clientResponse -> {
					log.error("404 error when calling Neynar Created Subscriptions API by fid {}", fid);
					return Mono.empty();
				})
				.bodyToMono(SubscriptionsCreatedMessage.class)
				.onErrorResume(WebClientResponseException.class, e -> {
					if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
						log.debug("404 error calling Neynar Created Subscriptions API by fid {} - {}", fid, e.getMessage());
						return Mono.empty();
					}
					log.debug("Exception calling Neynar Created Subscriptions API by fid {} - {}", fid, e.getMessage());
					return Mono.error(e);
				})
				.onErrorResume(Throwable.class, e -> {
					log.debug("Exception calling Neynar Created Subscriptions API by fid {} - {}", fid, e.getMessage());
					return Mono.empty();
				})
				.blockOptional()
				.map(SubscriptionsCreatedMessage::subscriptionsCreated)
				.orElse(Collections.emptyList());
	}

	@Override
	public List<SubscribersMessage.Subscriber> subscribers(int fid) {
		log.debug("Calling Neynar Subscribers API by fid {}", fid);
		return neynarClient.get()
				.uri(uriBuilder -> uriBuilder.path("/user/subscribers")
						.queryParam("fid", fid == 19129 ? 576 : fid)
						.queryParam("subscription_provider", "fabric_stp")
						.build())
				.retrieve()
				.onStatus(HttpStatus.NOT_FOUND::equals, clientResponse -> {
					log.error("404 error when calling Neynar Created Subscriptions API by fid {}", fid);
					return Mono.empty();
				})
				.bodyToMono(SubscribersMessage.class)
				.onErrorResume(WebClientResponseException.class, e -> {
					if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
						log.debug("404 error calling Neynar Created Subscriptions API by fid {} - {}", fid, e.getMessage());
						return Mono.empty();
					}
					log.debug("Exception calling Neynar Created Subscriptions API by fid {} - {}", fid, e.getMessage());
					return Mono.error(e);
				})
				.onErrorResume(Throwable.class, e -> {
					log.debug("Exception calling Neynar Created Subscriptions API by fid {} - {}", fid, e);
					return Mono.empty();
				})
				.blockOptional()
				.map(SubscribersMessage::subscribers)
				.orElse(Collections.emptyList());
	}
}