package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.payflow.message.ValidateMessageRequest;
import ua.sinaver.web3.payflow.message.ValidatedFrameMessage;
import ua.sinaver.web3.payflow.message.ValidatedMessage;

import java.util.HexFormat;

@Slf4j
@Service
public class FarcasterHubService implements IFarcasterHubService {

	private final WebClient hubsClient;
	private final WebClient neynarClient;

	public FarcasterHubService(@Value("${payflow.hub.api.url}") String hubApiUrl,
	                           @Value("${payflow.hub.api.key}") String hubApiKey) {
		hubsClient = WebClient.builder()
				.baseUrl(hubApiUrl.concat("/v1/validateMessage"))
				.defaultHeader("api_key", hubApiKey)
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.build();

		neynarClient = WebClient.builder()
				.baseUrl("https://api.neynar.com")
				.defaultHeader("api_key", hubApiKey)
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.build();
	}

	@Override
	@Retryable
	public ValidatedMessage validateFrameMessage(String frameMessageInHex) {
		log.debug("Calling Hubs ValidateMessage API for message {}",
				frameMessageInHex);

		try {
			return hubsClient.post()
					.bodyValue(HexFormat.of().parseHex(frameMessageInHex))
					.retrieve().bodyToMono(ValidatedMessage.class).block();
		} catch (Throwable t) {
			log.debug("Exception calling Hubs ValidateMessage API: {}", t.getMessage());
			throw t;
		}
	}

	@Override
	@Retryable
	public ValidatedFrameMessage validateFrameMessageWithNeynar(String frameMessageInHex) {
		log.debug("Calling Neynar Frame Validate API for message {}",
				frameMessageInHex);
		try {
			return neynarClient.post()
					.uri("/v2/farcaster/frame/validate")
					.bodyValue(new ValidateMessageRequest(false, false, frameMessageInHex))
					.retrieve().bodyToMono(ValidatedFrameMessage.class).block();
		} catch (Throwable t) {
			log.debug("Exception calling Neynar Frame Validate API: {}", t.getMessage());
			throw new Error(t.getMessage());
		}
	}
}