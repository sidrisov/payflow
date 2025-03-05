package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.graphql.client.ClientGraphQlResponse;
import org.springframework.graphql.client.GraphQlClient;
import org.springframework.graphql.client.HttpGraphQlClient;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import ua.sinaver.web3.payflow.graphql.generated.types.*;
import ua.sinaver.web3.payflow.message.ConnectedAddresses;
import ua.sinaver.web3.payflow.service.api.ISocialGraphService;

import static ua.sinaver.web3.payflow.config.CacheConfig.*;

@Service
@Slf4j
public class AirstackSocialGraphService implements ISocialGraphService {

	private final GraphQlClient airstackGraphQlClient;

	public AirstackSocialGraphService(WebClient.Builder builder,
			@Value("${payflow.airstack.api.url}") String airstackUrl,
			@Value("${payflow.airstack.api.key}") String airstackApiKey) {
		val airstackWebClient = builder
				.baseUrl(airstackUrl)
				.build();

		airstackGraphQlClient = HttpGraphQlClient.builder(airstackWebClient)
				.header(HttpHeaders.AUTHORIZATION, airstackApiKey)
				.build();
	}

	@Override
	@CacheEvict(value = FARCASTER_VERIFICATIONS_CACHE_NAME)
	public void cleanIdentityVerifiedAddressesCache(String identity) {
		log.debug("Cleared verification cache for {}", identity);
	}

	@Override
	@Cacheable(value = FARCASTER_VERIFICATIONS_CACHE_NAME, unless = "#result==null")
	public ConnectedAddresses getIdentityVerifiedAddresses(String identity) {
		val verifiedAddressesResponse = airstackGraphQlClient.documentName("getFarcasterVerifications")
				.variable("identity", identity)
				.execute().block();

		if (verifiedAddressesResponse == null) {
			log.error("No connected addresses for {}", identity);
			return null;
		}

		val verifiedAddresses = verifiedAddressesResponse.field("Socials.Social")
				.toEntityList(Social.class).stream()
				.limit(1).findFirst()
				.map(s -> new ConnectedAddresses(s.getUserAddress(),
						s.getConnectedAddresses().stream()
								.map(ConnectedAddress::getAddress)
								.filter(address -> address.startsWith("0x"))
								.toList()))
				.orElse(null);
		log.debug("Found verified addresses for {} - {}", verifiedAddresses, identity);
		return verifiedAddresses;
	}

	@Override
	@CacheEvict(cacheNames = SOCIALS_CACHE_NAME)
	public void cleanCache(String identity) {
		log.debug("Evicting socials cache for {} key", identity);
	}

	@Override
	@Cacheable(cacheNames = SOCIALS_CACHE_NAME, unless = "#result==null")
	public Wallet getSocialMetadata(String identity) {
		try {
			ClientGraphQlResponse socialMetadataResponse = airstackGraphQlClient.documentName(
					"getSocialMetadata")
					.variable("identity", identity)
					.execute()
					.onErrorResume(exception -> {
						log.error("Error fetching {} - {}", identity, exception.getMessage());
						return Mono.empty();
					})
					.block();

			if (socialMetadataResponse != null) {
				if (log.isTraceEnabled()) {
					log.trace("Fetched socialMetadata for {}: {}", identity, socialMetadataResponse);
				} else {
					log.debug("Fetched socialMetadata for {}", identity);
				}
				return socialMetadataResponse.field("Wallet").toEntity(Wallet.class);
			}
		} catch (Throwable t) {
			if (log.isTraceEnabled()) {
				log.error("Full Error:", t);
			} else {
				log.error("Error: {}", t.getMessage());
			}
		}
		return null;
	}

	@Override
	public FarcasterChannel getFarcasterChannelByChannelId(String channelId) {
		try {
			val response = airstackGraphQlClient.documentName("getFarcasterChannelForChannelId")
					.variable("channelId", channelId)
					.execute()
					.block();

			if (response != null) {
				val channels = response.field("FarcasterChannels.FarcasterChannel")
						.toEntityList(FarcasterChannel.class);

				if (!channels.isEmpty()) {
					val channel = channels.get(0);
					log.debug("Fetched Farcaster channel for channelId {}: {}", channelId, channel);
					return channel;
				}
			}
		} catch (Throwable t) {
			log.error("Error during fetching Farcaster channel for channelId: {}, error: {} - {}",
					channelId,
					t.getMessage(),
					log.isTraceEnabled() ? t : null);
		}

		log.warn("Failed to fetch Farcaster channel for channelId: {}", channelId);
		return null;
	}
}
