package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.payflow.message.ConnectedAddresses;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.message.alfafrens.ChannelSubscribersAndStakesResponseMessage;
import ua.sinaver.web3.payflow.message.alfafrens.UserByFidResponseMessage;
import ua.sinaver.web3.payflow.message.subscription.SubscribersMessage;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.service.api.ISocialGraphService;

import java.util.*;
import java.util.stream.Collectors;

import static ua.sinaver.web3.payflow.config.CacheConfig.CONTACT_LIST_CACHE_NAME;

@Slf4j
@Service
public class IdentitySubscriptionsService {

	private final WebClient webClient;

	@Autowired
	private IIdentityService identityService;

	@Autowired
	private ISocialGraphService socialGraphService;

	@Autowired
	private IFarcasterNeynarService neynarService;

	public IdentitySubscriptionsService(WebClient.Builder builder) {
		webClient = builder
				.baseUrl("https://www.alfafrens.com/api/v0")
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.build();
	}

	@Cacheable(value = CONTACT_LIST_CACHE_NAME, key = "'alfafrens-list:' + #identity", unless =
			"#result.isEmpty()")
	public List<String> fetchAlfaFrensSubscribers(String identity) {
		log.debug("Fetching alfa frens subscribers for identity: {}", identity);

		try {
			val fid = identityService.getIdentityFid(identity);

			log.debug("Fetched fid: {} for identity: {}", fid, identity);
			if (StringUtils.isBlank(fid)) {
				log.error("No fid found for identity: {}", identity);
				return Collections.emptyList();
			}

			val userResponse = webClient.get()
					.uri(uriBuilder -> uriBuilder.path("/getUserByFid")
							.queryParam("fid", fid)
							.build())
					.retrieve().bodyToMono(UserByFidResponseMessage.class).block();

			if (userResponse == null || StringUtils.isBlank(userResponse.channelAddress())) {
				log.error("No alfa frens user found for fid or not channel: {}, response: {}",
						fid, userResponse);
				return Collections.emptyList();
			}

			log.debug("Fetched alfa frens user response: {} for fid: {}", userResponse, fid);

			val channelAddress = userResponse.channelAddress();
			val channelResponse = webClient.get()
					.uri(uriBuilder -> uriBuilder.path("/getChannelSubscribersAndStakes")
							.queryParam("channelAddress", channelAddress)
							.build())
					.retrieve().bodyToMono(ChannelSubscribersAndStakesResponseMessage.class).block();

			if (channelResponse == null) {
				log.error("Channel not found for address: {}", channelAddress);
				return Collections.emptyList();
			}

			log.debug("Fetched alfa frens channel response: {} for channel address: {}",
					channelResponse, channelAddress);

			val subscribers = channelResponse.members()
					.stream().filter(s -> s.isSubscribed() || s.isStaked())
					.map(s -> String.format(
							"fc_fid:%s", s.fid())).toList();
			log.debug("Fetched alfa frens subscribers: {} for identity: {}", subscribers, identity);

			val subscribersVerifiedAddresses = subscribers.stream()
					.map(s ->
							identityService.getIdentitiesInfo(
											verificationsWithoutCustodial(
													socialGraphService.getIdentityVerifiedAddresses(s)
											)
									).stream()
									.max(Comparator.comparingInt(IdentityMessage::score))
									.map(IdentityMessage::address)
									.orElse(null)
					)
					.filter(Objects::nonNull)
					.collect(Collectors.toList());

			log.debug("Fetched alfa frens subscribers subscribersVerifiedAddresses: {} for identity: {}", subscribersVerifiedAddresses,
					identity);

			return subscribersVerifiedAddresses;
		} catch (Throwable t) {
			log.error("Exception fetching alfa frens subscribers for identity: {}, error: {}",
					identity, t.getMessage());

			throw t;
		}
	}

	@Cacheable(value = CONTACT_LIST_CACHE_NAME, key = "'fabric-list:' + #identity", unless =
			"#result.isEmpty()")
	public List<String> fetchFabricSubscribers(String identity) {
		log.debug("Fetching fabric subscribers for identity: {}", identity);

		try {
			val fid = identityService.getIdentityFid(identity);

			log.debug("Fetched fid: {} for identity: {}", fid, identity);
			if (StringUtils.isBlank(fid)) {
				log.error("No fid found for identity: {}", identity);
				return Collections.emptyList();
			}

			val subscriptions = neynarService.subscriptionsCreated(Integer.parseInt(fid));
			if (subscriptions.isEmpty()) {
				log.error("No fabric subscriptions created by fid: {}", fid);
				return Collections.emptyList();
			}
			log.debug("Fetched fabric subscriptions created: {} for fid: {}", subscriptions, fid);

			val subscribers = neynarService.subscribers(Integer.parseInt(fid))
					.stream()
					.map(SubscribersMessage.Subscriber::creator)
					.distinct()
					.toList();

			if (subscribers.isEmpty()) {
				log.error("No fabric subscribers for fid: {}", fid);
				return Collections.emptyList();
			}

			log.debug("Total fabric subscribers: {} for fid: {}", subscribers.size(), fid);

			val subscribersScoredAddresses = subscribers.stream()
					.limit(5)
					.map(user -> identityService.getIdentitiesInfo(user.verifications())
							.stream()
							.max(Comparator.comparingInt(IdentityMessage::score))
							.map(IdentityMessage::address)
							.orElse(null))
					.filter(Objects::nonNull)
					.collect(Collectors.toList());
			log.debug("Fetched fabric subscribers scored address: {} for fid: {} ({})",
					subscriptions,
					fid,
					identity);
			return subscribersScoredAddresses;
		} catch (Throwable t) {
			log.error("Exception fetching fabric subscribers for identity: {}, error: {}",
					identity, t.getMessage());
			throw t;
		}
	}

	private List<String> verificationsWithoutCustodial(ConnectedAddresses verifications) {
		val addresses = verifications.connectedAddresses();
		if (addresses.size() > 1) {
			val updatedAddresses = new ArrayList<>(addresses);
			updatedAddresses.remove(verifications.userAddress());
			return updatedAddresses;
		} else {
			return addresses;
		}
	}
}
