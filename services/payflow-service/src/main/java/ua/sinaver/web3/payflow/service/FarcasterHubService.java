package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.payflow.message.*;
import ua.sinaver.web3.payflow.service.api.IFarcasterHubService;

import java.util.List;

@Slf4j
@Service
public class FarcasterHubService implements IFarcasterHubService {

	private final WebClient neynarClient;

	public FarcasterHubService(@Value("${payflow.hub.api.url}") String hubApiUrl,
	                           @Value("${payflow.hub.api.key}") String hubApiKey) {

		neynarClient = WebClient.builder()
				.baseUrl("https://api.neynar.com")
				.defaultHeader("api_key", hubApiKey)
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.build();
	}

	@Override
	@Retryable
	public ValidatedFrameMessage validateFrameMessageWithNeynar(String frameMessageInHex) {
		log.debug("Calling Neynar Frame Validate API for message {}",
				frameMessageInHex);
		try {
			return neynarClient.post()
					.uri("/v2/farcaster/frame/validate")
					.bodyValue(new ValidateMessageRequest(false, false, true, frameMessageInHex))
					.retrieve().bodyToMono(ValidatedFrameMessage.class).block();
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
					.uri("/v2/farcaster/cast")
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
	@Retryable
	public NotificationResponse getFidNotifications(int fid, String cursor) {
		log.debug("Calling Neynar Notifications API for fid {}",
				fid);
		try {
			val response = neynarClient.get()
					.uri(uriBuilder -> uriBuilder.path("/v2/farcaster/notifications")
							.queryParam("fid", fid)
							.queryParam("cursor", cursor)
							.queryParam("limit", 50)
							.build())
					.retrieve().bodyToMono(NotificationResponse.class).block();

			log.trace("Response: {}", response);
			return response;
		} catch (Throwable t) {
			log.debug("Exception calling Neynar Notifications API for fid {} - {}",
					fid, t.getMessage());
			throw t;
		}
	}
}