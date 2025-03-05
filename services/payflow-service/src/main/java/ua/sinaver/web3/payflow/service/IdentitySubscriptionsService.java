package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.checkerframework.checker.units.qual.s;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.entity.User;
import ua.sinaver.web3.payflow.message.ConnectedAddresses;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.message.alfafrens.ChannelSubscribersAndStakesResponseMessage;
import ua.sinaver.web3.payflow.message.alfafrens.UserByFidResponseMessage;
import ua.sinaver.web3.payflow.message.subscription.SubscriberMessage;
import ua.sinaver.web3.payflow.message.subscription.SubscribersMessage;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.service.api.ISocialGraphService;

import java.util.*;
import java.util.stream.Collectors;

import static ua.sinaver.web3.payflow.config.CacheConfig.CONTACT_LIST_CACHE_NAME;

@Slf4j
@Service
public class IdentitySubscriptionsService {

	private final WebClient webClient;

	private final WebClient onchainServiceClient;

	@Autowired
	private IIdentityService identityService;

	@Autowired
	private ISocialGraphService socialGraphService;

	@Autowired
	private FarcasterNeynarService neynarService;

	@Autowired
	private UserRepository userRepository;

	@Value("${payflow.hypersub.contacts.limit:10}")
	private int hypersubContactsLimit;

	@Value("${payflow.paragraph.contacts.limit:10}")
	private int paragraphContactsLimit;

	public IdentitySubscriptionsService(WebClient.Builder builder,
			PayflowConfig payflowConfig) {
		webClient = builder
				.baseUrl("https://www.alfafrens.com/api/v0")
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.build();

		onchainServiceClient = builder
				.baseUrl(payflowConfig.getFramesServiceUrl())
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.build();
	}

	@Cacheable(value = CONTACT_LIST_CACHE_NAME, key = "'alfafrens-list:' + #identity", unless = "#result.isEmpty()")
	public List<String> fetchAlfaFrensSubscribers(String identity) {
		log.debug("Fetching alfa frens subscribers for identity: {}", identity);

		return Collections.emptyList();

		/*
		 * try {
		 * val fid = identityService.getIdentityFid(identity);
		 * 
		 * log.debug("Fetched fid: {} for identity: {}", fid, identity);
		 * if (StringUtils.isBlank(fid)) {
		 * log.error("No fid found for identity: {}", identity);
		 * return Collections.emptyList();
		 * }
		 * 
		 * val userResponse = webClient.get()
		 * .uri(uriBuilder -> uriBuilder.path("/getUserByFid")
		 * .queryParam("fid", fid)
		 * .build())
		 * .retrieve().bodyToMono(UserByFidResponseMessage.class).block();
		 * 
		 * if (userResponse == null ||
		 * StringUtils.isBlank(userResponse.channelAddress())) {
		 * log.error("No alfa frens user found for fid or not channel: {}, response: {}"
		 * ,
		 * fid, userResponse);
		 * return Collections.emptyList();
		 * }
		 * 
		 * log.debug("Fetched alfa frens user response: {} for fid: {}", userResponse,
		 * fid);
		 * 
		 * val channelAddress = userResponse.channelAddress();
		 * val channelResponse = webClient.get()
		 * .uri(uriBuilder -> uriBuilder.path("/getChannelSubscribersAndStakes")
		 * .queryParam("channelAddress", channelAddress)
		 * .build())
		 * .retrieve().bodyToMono(ChannelSubscribersAndStakesResponseMessage.class).
		 * block();
		 * 
		 * if (channelResponse == null) {
		 * log.error("Channel not found for address: {}", channelAddress);
		 * return Collections.emptyList();
		 * }
		 * 
		 * log.debug("Fetched alfa frens channel response: {} for channel address: {}",
		 * channelResponse, channelAddress);
		 * 
		 * val subscribers = channelResponse.members()
		 * .stream().filter(s -> s.isSubscribed() || s.isStaked())
		 * .map(s -> String.format(
		 * "fc_fid:%s", s.fid()))
		 * .toList();
		 * log.debug("Fetched alfa frens subscribers: {} for identity: {}", subscribers,
		 * identity);
		 * 
		 * val subscribersVerifiedAddresses = subscribers.stream()
		 * .map(s -> identityService.getIdentitiesInfo(
		 * verificationsWithoutCustodial(
		 * socialGraphService.getIdentityVerifiedAddresses(s)))
		 * .stream()
		 * .max(Comparator.comparingInt(IdentityMessage::score))
		 * .map(IdentityMessage::address)
		 * .orElse(null))
		 * .filter(Objects::nonNull)
		 * .collect(Collectors.toList());
		 * 
		 * log.
		 * debug("Fetched alfa frens subscribers subscribersVerifiedAddresses: {} for identity: {}"
		 * ,
		 * subscribersVerifiedAddresses,
		 * identity);
		 * 
		 * return subscribersVerifiedAddresses;
		 * } catch (Throwable t) {
		 * log.
		 * error("Exception fetching alfa frens subscribers for identity: {}, error: {}"
		 * ,
		 * identity, t.getMessage());
		 * 
		 * throw t;
		 * }
		 */
	}

	@Cacheable(value = CONTACT_LIST_CACHE_NAME, key = "'fabric-list:' + #identity", unless = "#result.isEmpty()")
	public List<String> fetchFabricSubscribers(String identity) {
		log.debug("Fetching fabric subscribers for identity: {}", identity);

		try {
			val fid = identityService.getIdentityFid(identity);

			log.debug("Fetched fid: {} for identity: {}", fid, identity);
			if (StringUtils.isBlank(fid)) {
				log.error("No fid found for identity: {}", identity);
				return Collections.emptyList();
			}

			/*
			 * val subscriptions =
			 * neynarService.subscriptionsCreated(Integer.parseInt(fid));
			 * if (subscriptions.isEmpty()) {
			 * log.error("No fabric subscriptions created by fid: {}", fid);
			 * return Collections.emptyList();
			 * }
			 * log.debug("Fetched fabric subscriptions created: {} for fid: {}",
			 * subscriptions, fid);
			 */

			val subscribers = neynarService.subscribers(Integer.parseInt(fid), true)
					.stream()
					.map(SubscribersMessage.Subscriber::user)
					.distinct()
					.toList();

			if (subscribers.isEmpty()) {
				log.error("No fabric subscribers for fid: {}", fid);
				return Collections.emptyList();
			}

			log.debug("Total fabric subscribers: {} for fid: {}", subscribers.size(), fid);

			val allAddresses = subscribers.stream()
					.flatMap(subscriber -> subscriber.addressesWithoutCustodialIfAvailable().stream())
					.distinct()
					.collect(Collectors.toList());

			// Fetch all users in a single query
			val usersMap = userRepository.findAllByIdentityInIgnoreCase(allAddresses)
					.stream()
					.collect(Collectors.toMap(u -> u.getIdentity().toLowerCase(), u -> u));

			val subscribersScoredAddresses = subscribers.stream()
					.map(subscriber -> determinePreferredAddress(subscriber.addressesWithoutCustodialIfAvailable(),
							usersMap))
					.filter(Objects::nonNull)
					.collect(Collectors.toList());

			log.debug("Fetched fabric subscribers scored address: {} for fid: {} ({})",
					subscribers,
					fid,
					identity);
			return subscribersScoredAddresses;
		} catch (Throwable t) {
			log.error("Exception fetching fabric subscribers for identity: {}, error: {}",
					identity, t.getMessage());
			throw t;
		}
	}

	@Cacheable(value = CONTACT_LIST_CACHE_NAME, key = "'paragraph-list:' + #identity", unless = "#result.isEmpty()")
	public List<String> fetchParagraphSubscribers(String identity) {
		log.debug("Fetching paragraph subscribers for identity: {}", identity);

		try {
			val fid = identityService.getIdentityFid(identity);

			log.debug("Fetched fid: {} for identity: {}", fid, identity);
			if (StringUtils.isBlank(fid)) {
				log.error("No fid found for identity: {}", identity);
				return Collections.emptyList();
			}

			val subscribers = neynarService.subscribers(Integer.parseInt(fid), false)
					.stream()
					.map(SubscribersMessage.Subscriber::user)
					.distinct()
					.toList();

			if (subscribers.isEmpty()) {
				log.error("No paragraph subscribers for fid: {}", fid);
				return Collections.emptyList();
			}

			log.debug("Total paragraph subscribers: {} for fid: {}", subscribers.size(), fid);

			val subscribersScoredAddresses = subscribers.stream()
					.limit(paragraphContactsLimit)
					.map(user -> identityService.getIdentitiesInfo(user.addressesWithoutCustodialIfAvailable())
							.stream()
							.max(Comparator.comparingInt(IdentityMessage::score))
							.map(IdentityMessage::address)
							.orElse(null))
					.filter(Objects::nonNull)
					.collect(Collectors.toList());
			log.debug("Fetched paragraph subscribers scored address: {} for fid: {} ({})",
					subscribers,
					fid,
					identity);
			return subscribersScoredAddresses;
		} catch (Throwable t) {
			log.error("Exception paragraph fabric subscribers for identity: {}, error: {}",
					identity, t.getMessage());
			throw t;
		}
	}

	private List<String> verificationsWithoutCustodial(ConnectedAddresses verifications) {
		if (verifications == null) {
			return Collections.emptyList();
		}

		val addresses = verifications.connectedAddresses();
		if (addresses.size() > 1) {
			val updatedAddresses = new ArrayList<>(addresses);
			updatedAddresses.remove(verifications.userAddress());
			return updatedAddresses;
		} else {
			return addresses;
		}
	}

	public List<SubscriberMessage> fetchHypersubSubscribers(int chainId, String contractAddress,
			List<String> accounts) {
		return onchainServiceClient.get()
				.uri(uriBuilder -> uriBuilder
						.path("/hypersub/subscribers")
						.pathSegment("{chainId}", "{contractAddress}")
						.queryParam("accounts", accounts.toArray())
						.build(chainId, contractAddress))
				.retrieve()
				.onStatus(HttpStatusCode::isError, response -> {
					log.error("Error fetching hypersub subscribers for contract: {} on chain: {} with status code: {}",
							contractAddress, chainId, response.statusCode());
					return Mono.error(new RuntimeException("Error fetching trending casts"));
				})
				.bodyToFlux(SubscriberMessage.class)
				.collectList()
				.onErrorResume(e -> {
					log.error("Error fetching hypersub subscribers for contract: {} on chain: {}",
							contractAddress, chainId, e);
					return Mono.just(Collections.emptyList());
				}).blockOptional().orElse(Collections.emptyList());
	}

	private String determinePreferredAddress(List<String> addresses, Map<String, User> usersMap) {
		return addresses.stream()
				.max(Comparator.<String, Integer>comparing(address -> {
					val positionScore = addresses.indexOf(address);
					val profileBonus = usersMap.containsKey(address.toLowerCase()) ? 10 : 0;
					return positionScore + profileBonus;
				})).orElse(null);
	}
}
