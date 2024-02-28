package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static ua.sinaver.web3.payflow.config.CacheConfig.ETH_DENVER_PARTICIPANTS_CACHE_NAME;
import static ua.sinaver.web3.payflow.config.CacheConfig.SOCIALS_CACHE_NAME;

@Service
@Slf4j
public class SocialGraphService implements ISocialGraphService {

	private final GraphQlClient graphQlClient;

	@Value("${payflow.airstack.contacts.limit:10}")
	private int contactsLimit;

	@Value("${payflow.invitation.whitelisted.default.users}")
	private Set<String> whitelistedUsers;

	public SocialGraphService(@Value("${payflow.airstack.api.url}") String airstackUrl,
	                          @Value("${payflow.airstack.api.key}") String airstackApiKey) {
		WebClient client = WebClient.builder()
				.baseUrl(airstackUrl)
				.build();

		graphQlClient = HttpGraphQlClient.builder(client)
				.header(HttpHeaders.AUTHORIZATION, airstackApiKey)
				.build();
	}

	@Override
	@Cacheable(value = ETH_DENVER_PARTICIPANTS_CACHE_NAME, unless = "#result.isEmpty()")
	public List<Wallet> getEthDenverParticipants() {
		var hasNextPage = false;
		var nextCursor = "";
		val participants = new ArrayList<Wallet>();

		do {
			try {
				val ethDenverParticipantsResponse = graphQlClient.documentName("getEthDenverParticipants")
						.variable("cursor", nextCursor)
						.execute().block();

				if (ethDenverParticipantsResponse != null) {
					val pageInfo = ethDenverParticipantsResponse
							.field("polygon.pageInfo")
							.toEntity(PageInfo.class);
					hasNextPage = pageInfo != null && pageInfo.getHasNextPage();
					nextCursor = pageInfo != null ? pageInfo.getNextCursor() : "";

					val rawParticipants = ethDenverParticipantsResponse
							.field("polygon.TokenBalance")
							.toEntityList(TokenBalance.class);

					participants.addAll(rawParticipants.stream()
							.filter(tb ->
									tb.getOwner().getPrimaryDomain() != null || (tb.getOwner().getDomains() != null && !tb.getOwner().getDomains().isEmpty()) ||
											(tb.getOwner().getSocials() != null && !tb.getOwner().getSocials().isEmpty())
							)
							.map(TokenBalance::getOwner)
							.toList());

					log.debug("Fetched {} participants", participants.size());

				} else {
					hasNextPage = false;
				}
			} catch (Exception e) {
				log.error("Error fetching EthDenver participants: {}", e.getMessage());
				hasNextPage = false;
			}

		} while (hasNextPage);

		return participants;
	}

	@Override
	public List<String> getSocialFollowings(String identity) {
		val identityLimitAdjusted = contactsLimit * (whitelistedUsers.contains(identity) ?
				3 : 1);

		val addressesLimitAdjusted = contactsLimit * (whitelistedUsers.contains(identity) ?
				5 : 2);

		val topFollowingsResponse = graphQlClient.documentName("getSocialFollowings")
				.variable("identity", identity)
				.variable("limit", identityLimitAdjusted)
				.execute().block();

		if (topFollowingsResponse != null) {
			return topFollowingsResponse.field("SocialFollowings.Following")
					.toEntityList(SocialFollowing.class).stream()
					.map(f -> f.getFollowingAddress().getAddresses())
					.flatMap(List::stream)
					.distinct().limit(addressesLimitAdjusted)
					.collect(Collectors.toList());
		} else {
			return Collections.emptyList();
		}
	}

	@Override
	public ConnectedAddresses getIdentityConnectedAddresses(String identity) {
		val connectedAddressesResponse = graphQlClient.documentName("getIdentityConnectedAddresses")
				.variable("identity", identity)
				.execute().block();

		if (connectedAddressesResponse == null) {
			log.error("No connected addresses for {}", identity);
			return null;
		}

		val connectedAddresses = connectedAddressesResponse.field("Socials.Social")
				.toEntityList(Social.class).stream()
				.limit(1).findFirst()
				.map(s -> new ConnectedAddresses(s.getUserAddress(),
						s.getUserAssociatedAddresses())).orElse(null);
		log.debug("Found connected addresses for {} - {}", connectedAddresses, identity);
		return connectedAddresses;
	}

	@Override
	@CacheEvict(cacheNames = SOCIALS_CACHE_NAME)
	public void cleanCache(String identity, String me) {
		log.debug("Evicting socials cache for {}_{} key", identity, me);
	}

	@Override
	@Cacheable(cacheNames = SOCIALS_CACHE_NAME, unless = "#result==null")
	public Wallet getSocialMetadata(String identity, String me) {
		try {
			val documentName = StringUtils.isBlank(me) ? "getSocialMetadata" :
					"getSocialMetadataAndInsights";
			ClientGraphQlResponse socialMetadataResponse = graphQlClient.documentName(
							documentName)
					.variable("identity", identity)
					.variable("me", me)
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

				// TODO: some issue with projections, set manually
				val wallet = socialMetadataResponse.field("Wallet").toEntity(Wallet.class);

				if (wallet != null) {
					val followings =
							socialMetadataResponse.field("Wallet.socialFollowings.Following")
									.toEntityList(SocialFollowing.class);

					val followers =
							socialMetadataResponse.field("Wallet.socialFollowers.Follower")
									.toEntityList(SocialFollower.class);

					val ethTransfers =
							socialMetadataResponse.field("Wallet.ethTransfers")
									.toEntityList(TokenTransfer.class);
					val baseTransfers =
							socialMetadataResponse.field("Wallet.baseTransfers")
									.toEntityList(TokenTransfer.class);

					val socialFollowings =
							new SocialFollowingOutput.Builder().Following(followings).build();

					val socialFollowers =
							new SocialFollowerOutput.Builder().Follower(followers).build();

					wallet.setSocialFollowings(socialFollowings);
					wallet.setSocialFollowers(socialFollowers);

					val tokenTransfers = new ArrayList<TokenTransfer>();
					tokenTransfers.addAll(ethTransfers);
					tokenTransfers.addAll(baseTransfers);
					wallet.setTokenTransfers(tokenTransfers);

				}
				return wallet;
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
}
