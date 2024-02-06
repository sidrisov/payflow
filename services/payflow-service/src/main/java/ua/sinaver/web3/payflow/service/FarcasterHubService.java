package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.payflow.message.ValidatedMessage;

import java.util.HexFormat;

@Slf4j
@Service
public class FarcasterHubService implements IFarcasterHubService {

	private final WebClient client;

	public FarcasterHubService(@Value("${payflow.hub.api.url}") String hubApiUrl,
	                           @Value("${payflow.hub.api.key}") String hubApiKey) {
		client = WebClient.builder()
				.baseUrl(hubApiUrl.concat("/v1/validateMessage"))
				.defaultHeader("api_key", hubApiKey)
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.build();
	}

	@Override
	@Retryable
	public ValidatedMessage validateFrameMessage(String frameMessageInHex) {
		log.debug("Calling Hubs ValidateMessage API for message {}",
				frameMessageInHex);
		return client.post()
				.bodyValue(HexFormat.of().parseHex(frameMessageInHex))
				.retrieve().bodyToMono(ValidatedMessage.class).block();
	}
}


/*


    return await fetch(`${process.env.FARCASTER_HUB}/v1/validateMessage`,{
        method: "POST",
        headers: {
            "Content-Type": "application/octet-stream"
        },
        body: Buffer.from(messageBytes, 'hex'),
    })
 */