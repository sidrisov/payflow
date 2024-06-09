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

import java.util.*;

import static ua.sinaver.web3.payflow.config.CacheConfig.*;

@Service
@Slf4j
public class SocialGraphService implements ISocialGraphService {

	private final GraphQlClient graphQlClient;

	@Value("${payflow.airstack.contacts.limit:10}")
	private int contactsLimit;

	@Value("${payflow.invitation.whitelisted.default.users}")
	private Set<String> whitelistedUsers;

	public SocialGraphService(WebClient.Builder builder,
	                          @Value("${payflow.airstack.api.url}") String airstackUrl,
	                          @Value("${payflow.airstack.api.key}") String airstackApiKey) {
		WebClient client = builder
				.baseUrl(airstackUrl)
				.build();

		graphQlClient = HttpGraphQlClient.builder(client)
				.header(HttpHeaders.AUTHORIZATION, airstackApiKey)
				.build();
	}

	@Override
	@Cacheable(value = TOKEN_OWNERS_CACHE_NAME, unless = "#result.isEmpty()")
	public List<String> getAllTokenOwners(String blockchain, String address) {
		var hasNextPage = false;
		var nextCursor = "";
		val participants = new ArrayList<String>();

		do {
			try {
				val owners = graphQlClient.documentName(
								"getTokenOwners")
						.variable("blockchain", blockchain)
						.variable("tokenAddress", address)
						.variable("cursor", nextCursor)
						.execute().block();

				if (owners != null) {
					val pageInfo = owners
							.field("TokenBalances.pageInfo")
							.toEntity(PageInfo.class);
					hasNextPage = pageInfo != null && pageInfo.getHasNextPage();
					nextCursor = pageInfo != null ? pageInfo.getNextCursor() : "";

					val rawParticipants = owners
							.field("TokenBalances.TokenBalance")
							.toEntityList(TokenBalance.class);

					participants.addAll(rawParticipants.stream().map(o -> o.getOwner().getIdentity()).toList());

					log.debug("Fetched {} participants ", participants.size());

				} else {
					hasNextPage = false;
				}
			} catch (Exception e) {
				log.error("Error fetching FarCon participants (spork based): {}",
						e.getMessage());
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
					// remove Solana addresses
					.filter(f -> f.getFollowingAddress() != null && f.getFollowingAddress().getAddresses() != null)
					.map(f -> f.getFollowingAddress().getAddresses())
					.flatMap(List::stream)
					.filter(address -> address.startsWith("0x"))
					.distinct().limit(addressesLimitAdjusted)
					.toList();
		} else {
			return Collections.emptyList();
		}
	}

	@Override
	public FarcasterCast getTopCastReply(String parentHash, List<String> ignoredFids) {
		try {
			val replies = graphQlClient.documentName("getCastRepliesSocialCapitalValue")
					.variable("parentHash", parentHash)
					.execute().block();
			if (replies != null) {
				val topReply = replies.field("FarcasterReplies.Reply")
						.toEntityList(FarcasterCast.class).stream()
						.filter(reply -> reply.getSocialCapitalValue() != null && !ignoredFids.contains(reply.getFid()))
						.max(Comparator.comparingDouble(reply -> reply.getSocialCapitalValue().getFormattedValue()))
						.orElse(null);
				log.debug("Top cast reply: {} for hash: {}", topReply, parentHash);
				return topReply;
			}
		} catch (Throwable t) {
			log.error("Error during fetching top cast reply for hash: {}, error: {} - {}",
					parentHash,
					t.getMessage(),
					log.isTraceEnabled() ? t : null);
		}

		log.error("Failed to fetch top cast reply for hash: {} ", parentHash);
		return null;

	}

	@Override
	public FarcasterCast getReplySocialCapitalValue(String hash) {
		try {
			val replies = graphQlClient.documentName("getReplySocialCapitalValue")
					.variable("hash", hash)
					.execute().block();
			if (replies != null) {
				val reply = replies.field("FarcasterReplies.Reply")
						.toEntityList(FarcasterCast.class).stream()
						.findFirst().orElse(null);

				if (reply != null && reply.getSocialCapitalValue() != null) {
					log.debug("Reply SCV: {} for url: {}",
							reply.getSocialCapitalValue().getFormattedValue(), hash);
					return reply;
				}

			}
		} catch (Throwable t) {
			log.error("Error during fetching reply SCV for hash: {}, error: {} - {}",
					hash,
					t.getMessage(),
					log.isTraceEnabled() ? t : null);
		}

		log.error("Failed to fetch reply SCV for hash: {} ", hash);
		return null;

	}

	@Override
	@Cacheable(value = FARCASTER_VERIFICATIONS_CACHE_NAME, unless = "#result==null")
	public ConnectedAddresses getIdentityVerifiedAddresses(String identity) {
		val verifiedAddressesResponse = graphQlClient.documentName("getFarcasterVerifications")
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
						s.getUserAssociatedAddresses().stream()
								.filter(address -> address.startsWith("0x"))
								.toList())
				).orElse(null);
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
			ClientGraphQlResponse socialMetadataResponse = graphQlClient.documentName(
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
	@Cacheable(cacheNames = SOCIALS_INSIGHTS_CACHE_NAME, unless = "#result==null")
	public Wallet getSocialInsights(String identity, String me) {
		try {
			val socialMetadataResponse = graphQlClient.documentName(
							"getSocialInsights")
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
