package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import ua.sinaver.web3.payflow.message.efp.EfpFollowingsMessage;

import java.util.Collections;
import java.util.List;

import static ua.sinaver.web3.payflow.config.CacheConfig.CONTACT_LIST_CACHE_NAME;

@Slf4j
@Service
public class EthereumFollowProtocolService {

	private final WebClient efpClient;

	public EthereumFollowProtocolService(WebClient.Builder builder) {
		efpClient = builder.baseUrl("https://api.ethfollow.xyz/api/v1")
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.build();
	}

	@Cacheable(value = CONTACT_LIST_CACHE_NAME, key = "'efp-followings-list:' + #identity",
			unless = "#result.isEmpty()")
	public List<String> fetchFollowings(String identity) {
		log.debug("Calling EFP Fetch Followings API by identity {}", identity);
		return efpClient.get()
				.uri(uriBuilder -> uriBuilder.path("/users/{identity}/following")
						.queryParam("limit", 200)
						.build(identity))
				.retrieve()
				.onStatus(HttpStatus.NOT_FOUND::equals, clientResponse -> {
					log.error("404 error when calling EFP Fetch Followings API by identity {}", identity);
					return Mono.empty();
				})
				.bodyToMono(EfpFollowingsMessage.class)
				.onErrorResume(WebClientResponseException.class, e -> {
					if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
						log.error("404 error calling EFP Fetch Followings API by identity {} - {}",
								identity, e);
						return Mono.empty();
					}
					log.error("Exception calling EFP Fetch Followings API by identity {} - {}",
							identity, e);
					return Mono.error(e);
				})
				.onErrorResume(Throwable.class, e -> {
					log.error("Exception calling EFP Fetch Followings API by identity {} - {}",
							identity, e);
					return Mono.empty();
				})
				.blockOptional()
				.map(efpFollowingsMessage -> efpFollowingsMessage.following().stream()
						.map(EfpFollowingsMessage.EftFollowing::address) // Assuming
						.toList())
				.orElse(Collections.emptyList());
	}
}
