package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.graphql.client.ClientGraphQlResponse;
import org.springframework.graphql.client.GraphQlClient;
import org.springframework.graphql.client.HttpGraphQlClient;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import ua.sinaver.web3.payflow.graphql.generated.types.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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
	public List<String> getAllFollowingContacts(String identity) {
		val identityLimitAdjusted = contactsLimit * (whitelistedUsers.contains(identity) ?
				3 : 1);

		val addressesLimitAdjusted = contactsLimit * (whitelistedUsers.contains(identity) ?
				5 : 2);

		val topFollowings = graphQlClient.documentName("getSocialFollowings")
				.variable("identity", identity)
				.variable("limit", identityLimitAdjusted)
				.execute().block();

		if (topFollowings != null) {
			return topFollowings.field("SocialFollowings.Following")
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
	@Cacheable(cacheNames = "socials", unless = "#result==null")
	public Wallet getSocialMetadata(String identity, String me) {
		try {
			val documentName = StringUtils.isBlank(me) ? "getSocialMetadataByIdentity" :
					"getSocialMetadataAndInsightsByIdentity";
			ClientGraphQlResponse socialMetadata = graphQlClient.documentName(
							documentName)
					.variable("identity", identity)
					.variable("me", me)
					.execute()
					.onErrorResume(exception -> {
						log.error("Error fetching {} - {}", identity, exception.getMessage());
						return Mono.empty();
					})
					.block();

			if (socialMetadata != null) {
				if (log.isTraceEnabled()) {
					log.trace("Fetched socialMetadata for {}: {}", identity, socialMetadata);
				} else {
					log.debug("Fetched socialMetadata for {}", identity);
				}

				// TODO: some issue with projections, set manually
				val wallet = socialMetadata.field("Wallet").toEntity(Wallet.class);

				if (wallet != null) {
					val followings =
							socialMetadata.field("Wallet.socialFollowings.Following")
									.toEntityList(SocialFollowing.class);

					val followers =
							socialMetadata.field("Wallet.socialFollowers.Follower")
									.toEntityList(SocialFollower.class);

					val ethTransfers =
							socialMetadata.field("Wallet.ethTransfers")
									.toEntityList(TokenTransfer.class);
					val baseTransfers =
							socialMetadata.field("Wallet.baseTransfers")
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
