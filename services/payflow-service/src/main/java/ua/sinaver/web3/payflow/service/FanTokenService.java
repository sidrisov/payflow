package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.service.api.ISocialGraphService;

import java.util.Collections;
import java.util.List;

import static ua.sinaver.web3.payflow.config.CacheConfig.CONTACT_LIST_CACHE_NAME;

@Slf4j
@Service
@Transactional
public class FanTokenService {

	private static final String DEFAULT_FAN_TOKEN_NAME = "network:farcaster";

	@Autowired
	private ISocialGraphService socialGraphService;

	@Autowired
	private IdentityService identityService;

	@Cacheable(value = CONTACT_LIST_CACHE_NAME, key = "'moxie-fan-token-list:' + #identity", unless = "#result.isEmpty()")
	public List<String> fetchFanTokenHolders(String identity) {
		log.debug("Fetching fan token holders for identity: {}", identity);

		try {
			val fname = identityService.getIdentityFname(identity);
			log.debug("Fetched fname: {} for identity: {}", fname, identity);
			if (StringUtils.isBlank(fname)) {
				log.error("No fname found for identity: {}", identity);
				return Collections.emptyList();
			}

			var fanTokenHolders = socialGraphService.getFanTokenHolders(fname);
			if (fanTokenHolders.isEmpty()) {
				log.debug("Defaulting to fetch fan token holders for {}", DEFAULT_FAN_TOKEN_NAME);
				fanTokenHolders = socialGraphService.getFanTokenHolders(DEFAULT_FAN_TOKEN_NAME);
			}

			if (fanTokenHolders.isEmpty()) {
				log.error("No fan token holders for fname: {}", fname);
				return Collections.emptyList();
			}

			log.debug("Total fan token holders: {} for fname: {}", fanTokenHolders.size(),
					fname);

			return fanTokenHolders;
		} catch (Throwable t) {
			log.error("Exception fetching fan token holders for identity: {}, error: {}",
					identity, t.getMessage());
			throw t;
		}
	}
}
