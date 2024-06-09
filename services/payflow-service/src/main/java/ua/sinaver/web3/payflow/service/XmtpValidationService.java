package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.payflow.message.FrameMessage;
import ua.sinaver.web3.payflow.message.ValidatedXmtpFrameMessage;

@Service
@Slf4j
public class XmtpValidationService {

	private final WebClient webClient;

	public XmtpValidationService(WebClient.Builder builder,
	                             @Value("${payflow.frames.url}") String xmtpApiUrl) {
		webClient = builder.baseUrl(xmtpApiUrl)
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.build();
	}

	public ValidatedXmtpFrameMessage validateMessage(FrameMessage message) {
		val validatedMessage = webClient.post()
				.uri(uriBuilder -> uriBuilder.path("/xmtp/validate")
						.build())
				.bodyValue(message)
				.retrieve()
				.bodyToMono(ValidatedXmtpFrameMessage.class)
				.block();

		log.debug("Validate Xmtp Frame Message: {}", validatedMessage);
		return validatedMessage;
	}
}
