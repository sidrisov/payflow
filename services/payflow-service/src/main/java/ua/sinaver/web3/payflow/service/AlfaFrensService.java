package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.payflow.message.alfafrens.ChannelSubscribersAndStakesResponseMessage;
import ua.sinaver.web3.payflow.message.alfafrens.UserByFidResponseMessage;
import ua.sinaver.web3.payflow.service.api.IIdentityService;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@Transactional
public class AlfaFrensService {

	private final WebClient webClient;
	@Autowired
	private IIdentityService identityService;

	public AlfaFrensService() {
		webClient = WebClient.builder()
				.baseUrl("https://www.alfafrens.com")
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
				.build();
	}

	// TODO: make cacheable
	public List<String> fetchSubscribers(String identity) {
		log.debug("Fetching alfa frens subscribers for identity: {}", identity);

		try {

			val fid = identityService.getIdentityFid(identity, false);

			log.debug("Fetched fid: {} for identity: {}", fid, identity);

			if (StringUtils.isBlank(fid)) {
				log.error("No fid found for identity: {}", identity);
				return Collections.emptyList();
			}

			val userResponse = webClient.get()
					.uri(uriBuilder -> uriBuilder.path("/api/trpc/data.getUserByFid")
							.queryParam("fid", fid)
							.build())
					.retrieve().bodyToMono(UserByFidResponseMessage.class).block();

			log.debug("{}", userResponse);

			if (userResponse == null
					|| userResponse.result() == null
					|| userResponse.result().data() == null
					|| userResponse.result().data().channels() == null) {
				log.error("No alfa frens user found for fid: {}", fid);
				return Collections.emptyList();
			}

			log.debug("Fetched alfa frens user response: {} for fid: {}", userResponse, fid);

			val channelAddress = userResponse.result().data().channels().channelAddress();

			val channelResponse = webClient.get()
					.uri(uriBuilder -> uriBuilder.path("api/trpc/data.getChannelSubscribersAndStakes")
							.queryParam("channelAddress", channelAddress)
							.build())
					.retrieve().bodyToMono(ChannelSubscribersAndStakesResponseMessage.class).block();

			if (channelResponse == null) {
				log.error("Channel not found for address: {}", channelAddress);
				return Collections.emptyList();
			}

			log.debug("Fetched alfa frens channel response: {} for channel address: {}",
					channelResponse, channelAddress);

			val subscribers = channelResponse.result().data().members().stream().map(s -> String.format(
					"fc_fid:%s", s.fid())).toList();
			log.debug("Fetched alfa frens subscribers: {} for identity: {}", subscribers, identity);

			return subscribers;

		} catch (Throwable t) {
			log.error("Exception fetching alfa frens subscribers for identity: {}, error: {}",
					identity, t.getMessage());

			throw t;
		}
	}
}
