package ua.sinaver.web3.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.graphql.client.ClientGraphQlResponse;
import org.springframework.graphql.client.GraphQlClient;
import org.springframework.graphql.client.HttpGraphQlClient;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.graphql.generated.types.SocialFollower;
import ua.sinaver.web3.graphql.generated.types.SocialFollowing;
import ua.sinaver.web3.graphql.generated.types.TokenTransfer;
import ua.sinaver.web3.graphql.generated.types.Wallet;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ContactBookService implements IContactBookService {

	private final GraphQlClient graphQlClient;
	@Value("${payflow.airstack.contacts.limit:10}")
	private int contactsLimit;

	public ContactBookService(@Value("${payflow.airstack.api.url}") String airstackUrl,
	                          @Value("${payflow.airstack.api.key}") String airstackApiKey) {
		WebClient client = WebClient.builder()
				.baseUrl(airstackUrl)
				.build();

		graphQlClient = HttpGraphQlClient.builder(client)
				.header(HttpHeaders.AUTHORIZATION, airstackApiKey)
				.build();
	}

	@Override
	@Cacheable(cacheNames = "socials")
	public List<String> getAllContacts(String identity) {
		val topFollowings = graphQlClient.documentName("getSocialFollowings")
				.variable("identity", identity)
				.variable("limit", contactsLimit)
				.execute().block();

		if (topFollowings != null) {
			return topFollowings.field("SocialFollowings.Following")
					.toEntityList(SocialFollowing.class).stream()
					.map(f -> f.getFollowingAddress().getAddresses())
					.flatMap(List::stream)
					.distinct().limit(contactsLimit * 2L)
					.collect(Collectors.toList());
		} else {
			return Collections.emptyList();
		}
	}

	@Override
	@Cacheable(cacheNames = "socials")
	public Wallet getSocialMetadata(String identity, String me) {
		try {

			ClientGraphQlResponse socialMetadata = graphQlClient.documentName(
							"getSocialMetadataByIdentity")
					.variable("identity", identity)
					.variable("me", me)
					.execute().block();

			if (socialMetadata != null) {
				log.trace("socialMetadata: {}", socialMetadata);

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

					wallet.getSocialFollowings().setFollowing(followings);
					wallet.getSocialFollowers().setFollower(followers);

					val tokenTransfers = new ArrayList<TokenTransfer>();
					tokenTransfers.addAll(ethTransfers);
					tokenTransfers.addAll(baseTransfers);
					wallet.setTokenTransfers(tokenTransfers);

				}
				return wallet;
			}
		} catch (Throwable t) {
			log.error("Error", t);
		}

		return null;
	}
}
