package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.entity.User;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.api.IIdentityService;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import static ua.sinaver.web3.payflow.config.CacheConfig.CONTACT_LIST_CACHE_NAME;

@Slf4j
@Service
public class IdentityFollowingsService {

	@Autowired
	private IIdentityService identityService;

	@Autowired
	private FarcasterNeynarService neynarService;

	@Autowired
	private UserRepository userRepository;

	@Cacheable(value = CONTACT_LIST_CACHE_NAME, key = "'farcaster-followings-list:' + #identity", unless = "#result.isEmpty()")
	public List<String> fetchFarcasterFollowings(String identity) {
		log.debug("Fetching farcaster followings for identity: {}", identity);

		try {
			val fid = identityService.getIdentityFid(identity);

			log.debug("Fetched fid: {} for identity: {}", fid, identity);
			if (fid == null) {
				log.error("No fid found for identity: {}", identity);
				return Collections.emptyList();
			}

			val followings = neynarService.fetchTop100Followings(3)
					.stream()
					.toList();

			if (followings.isEmpty()) {
				log.error("No followings for fid: {}", fid);
				return Collections.emptyList();
			}

			log.debug("Total followings: {} for fid: {}", followings.size(), fid);

			val allAddresses = followings.stream()
					.flatMap(user -> user.addressesWithoutCustodialIfAvailable().stream())
					.distinct()
					.collect(Collectors.toList());

			// Fetch all users in a single query
			val usersMap = userRepository.findAllByIdentityInIgnoreCase(allAddresses)
					.stream()
					.collect(Collectors.toMap(u -> u.getIdentity().toLowerCase(), u -> u));

			val followingsScoredAddresses = followings.stream()
					.map(following -> determinePreferredAddress(following.addressesWithoutCustodialIfAvailable(),
							usersMap))
					.filter(Objects::nonNull)
					.collect(Collectors.toList());
			log.debug("Fetched followings scored addresses: {} for fid: {} ({})",
					followings,
					fid,
					identity);
			return followingsScoredAddresses;
		} catch (Throwable t) {
			log.error("Exception fetching followings for identity: {}, error: {}",
					identity, t.getMessage());
			throw t;
		}
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
