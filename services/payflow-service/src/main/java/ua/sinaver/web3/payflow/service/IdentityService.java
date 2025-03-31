package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import ua.sinaver.web3.payflow.client.NeynarClient;
import ua.sinaver.web3.payflow.entity.User;
import ua.sinaver.web3.payflow.message.ConnectedAddresses;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.message.farcaster.bankr.BankrWalletResponse;
import ua.sinaver.web3.payflow.message.farcaster.rodeo.RodeoResponse;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.api.IIdentityService;

import java.time.Duration;
import java.util.*;

import static ua.sinaver.web3.payflow.config.CacheConfig.BANKR_WALLETS_CACHE;
import static ua.sinaver.web3.payflow.config.CacheConfig.RODEO_WALLETS_CACHE;

@Slf4j
@Service
@Transactional
public class IdentityService implements IIdentityService {
	private final WebClient webClient;

	@Autowired
	private UserRepository userRepository;
	@Autowired
	private AirstackSocialGraphService socialGraphService;

	@Autowired
	private FarcasterNeynarService neynarService;

	@Autowired
	private NeynarClient neynarClient;

	public IdentityService(WebClient.Builder webClientBuilder) {
		this.webClient = webClientBuilder.build();
	}

	@Override
	public User getProfileByFid(int fid, String identity) {
		val profiles = getProfilesByFid(fid);
		return profiles.stream()
				.filter(p -> StringUtils.isBlank(identity) || p.getIdentity().equals(identity))
				.findFirst().orElse(null);
	}

	@Override
	public User getProfileByFname(String username, String identity) {
		val profiles = getProfilesByFname(username);
		return profiles.stream()
				.filter(p -> StringUtils.isBlank(identity) || p.getIdentity().equals(identity))
				.findFirst().orElse(null);
	}

	@Override
	public List<User> getProfilesByFid(int fid) {
		return getProfilesByAddresses(getFarcasterAddressesByFid(fid));
	}

	@Override
	public List<User> getProfilesByFname(String fname) {
		return getProfilesByAddresses(getFarcasterAddressesByUsername(fname));
	}

	@Override
	public List<String> getFarcasterAddressesByFid(int fid) {
		val farcasterUser = neynarService.fetchFarcasterUser(fid);
		if (farcasterUser == null) {
			log.warn("No farcaster user found for FID {}", fid);
			return Collections.emptyList();
		}

		val addresses = farcasterUser.addressesWithoutCustodialIfAvailable();
		log.debug("Addresses without custodial for {}: {}", fid, addresses);
		return addresses;
	}

	@Override
	public List<String> getFarcasterAddressesByAddress(String address) {
		try {
			val response = neynarClient.getUsersByAddresses(address.toLowerCase());

			log.debug("Response for {}: {}", address, response);
			if (response == null || response.isEmpty()) {
				log.warn("No response from Neynar for {}", address);
				return Collections.emptyList();
			}

			val user = response.get(address.toLowerCase()).getFirst();
			if (user == null) {
				log.warn("No user found for {}", address);
				return Collections.emptyList();
			}

			val verifications = user.addressesWithoutCustodialIfAvailable();
			log.debug("Addresses for {}: {}", address, verifications);
			return verifications;
		} catch (feign.FeignException.NotFound e) {
			log.warn("User not found for address {}: {}", address, e.getMessage());
			return Collections.emptyList();
		}
	}

	@Override
	public String getENSAddress(String ens) {
		val socialMetadata = socialGraphService.getSocialMetadata(ens);

		if (socialMetadata == null || socialMetadata.ens() == null) {
			log.warn("ENS Address for {} was not found!", ens);
			return null;
		}

		String ensAddress = socialMetadata.ens();
		log.debug("ENS Address for {}: {}", ens, ensAddress);
		return ensAddress;
	}

	@Override
	public List<String> getFarcasterAddressesByUsername(String username) {
		try {
			val response = neynarClient.getUserByUsername(username);

			log.debug("Response for {}: {}", username, response);
			if (response == null) {
				log.warn("No response from Neynar for {}", username);
				return Collections.emptyList();
			}

			val user = response.user();
			if (user == null) {
				log.warn("No user found for {}", username);
				return Collections.emptyList();
			}

			val verifications = user.addressesWithoutCustodialIfAvailable();
			log.debug("Addresses for {}: {}", username, verifications);
			return verifications;
		} catch (feign.FeignException.NotFound e) {
			log.warn("User not found for username {}: {}", username, e.getMessage());
			return Collections.emptyList();
		}
	}

	@Override
	public List<User> getProfilesByAddresses(List<String> addresses) {
		return addresses.stream().map(address -> userRepository.findByIdentityIgnoreCaseAndAllowedTrue(address))
				.filter(Objects::nonNull).limit(3).toList();
	}

	@Override
	public String getFidFname(int fid) {
		val farcasterUser = neynarService.fetchFarcasterUser(fid);
		if (farcasterUser == null) {
			log.warn("No farcaster user found for FID {}", fid);
			return null;
		}

		val username = farcasterUser.username();
		log.debug("Username for {}: {}", fid, username);
		return username;
	}

	@Override
	public String getFarcasterUsernameByAddress(String address) {
		try {
			log.debug("Fetching username for: {}", address);

			val response = neynarClient.getUsersByAddresses(address.toLowerCase());

			log.debug("Response for {}: {}", address, response);
			if (response == null || response.isEmpty()) {
				log.warn("No response from Neynar for {}", address);
				return null;
			}

			val user = response.get(address.toLowerCase()).getFirst();
			if (user == null) {
				log.warn("No user found for {}", address);
				return null;
			}

			val username = user.username();
			log.debug("Username for {}: {}", address, username);
			return username;
		} catch (feign.FeignException.NotFound e) {
			log.warn("User not found for address {}: {}", address, e.getMessage());
			return null;
		}
	}

	@Override
	public Integer getFnameFid(String username) {
		try {
			val response = neynarClient.getUserByUsername(username);

			log.debug("Response for {}: {}", username, response);
			if (response == null) {
				log.warn("No response from Neynar for {}", username);
				return null;
			}

			val user = response.user();
			if (user == null) {
				log.warn("No user found for {}", username);
				return null;
			}

			val fid = user.fid();
			log.debug("Fid for {}: {}", username, fid);
			return fid;
		} catch (feign.FeignException.NotFound e) {
			log.warn("User not found for username {}: {}", username, e.getMessage());
			return null;
		}
	}

	@Override
	public Integer getIdentityFid(String address) {
		try {
			log.debug("Fetching fid for: {}", address);

			val response = neynarClient.getUsersByAddresses(address.toLowerCase());

			log.debug("Response for {}: {}", address, response);
			if (response == null || response.isEmpty()) {
				log.warn("No response from Neynar for {}", address);
				return null;
			}

			val user = response.get(address.toLowerCase()).getFirst();
			if (user == null) {
				log.warn("No user found for {}", address);
				return null;
			}

			val fid = user.fid();
			log.debug("Fid for {}: {}", address, fid);
			return fid;
		} catch (feign.FeignException.NotFound e) {
			log.warn("User not found for address {}: {}", address, e.getMessage());
			return null;
		}
	}

	@Override
	public IdentityMessage getIdentityInfo(String identity) {
		val results = getIdentitiesInfo(Collections.singletonList(identity));
		return results.isEmpty() ? null : results.get(0);
	}

	@Override
	public List<IdentityMessage> getIdentitiesInfo(int fid) {
		val identities = getFarcasterAddressesByFid(fid);
		return getIdentitiesInfo(identities);
	}

	@Override
	public String getHighestScoredIdentity(List<String> identities) {
		return getIdentitiesInfo(identities)
				.stream().max(Comparator.comparingInt(IdentityMessage::score))
				.map(IdentityMessage::address).orElse(null);
	}

	@Override
	public IdentityMessage getHighestScoredIdentityInfo(List<String> identities) {
		return getIdentitiesInfo(identities)
				.stream().max(Comparator.comparingInt(IdentityMessage::score))
				.orElse(null);
	}

	@Override
	public List<IdentityMessage> getIdentitiesInfo(List<String> identities) {
		log.debug("Fetching {} identities", identities);
		try {
			val identityMessages = Flux
					.fromIterable(identities)
					.parallel()
					.runOn(Schedulers.boundedElastic())
					.flatMap(identity -> Mono.zip(
							Mono.just(identity),
							Mono.fromCallable(
									() -> Optional.ofNullable(
											userRepository.findByIdentityIgnoreCaseAndAllowedTrue(identity)))
									.onErrorResume(exception -> {
										log.error("Error fetching user {} - {}",
												identity,
												exception.getMessage());
										return Mono.empty();
									}),
							Mono.fromCallable(
									() -> socialGraphService.getSocialMetadata(identity))
									.subscribeOn(Schedulers.boundedElastic())
									.onErrorResume(exception -> {
										log.error("Error fetching social graph for {} - " +
												"{}",
												identity,
												exception.getMessage());
										return Mono.empty();
									}))
							.map(tuple -> IdentityMessage.convert(
									identity,
									tuple.getT2().orElse(null),
									tuple.getT3())))
					.sequential()
					.timeout(Duration.ofSeconds(10), Mono.empty())
					.collectList()
					.block();

			log.debug("Fetched {} identities for list: {}", identityMessages.size(),
					identities);

			return identityMessages;
		} catch (Throwable t) {
			log.error("Failed to fetch contacts", t);
			return Collections.emptyList();
		}
	}

	@Cacheable(value = BANKR_WALLETS_CACHE, key = "#identity", unless = "#result == null")
	public String getBankrWalletByIdentity(String identity) {
		val fid = getIdentityFid(identity);
		if (fid != null) {
			return getBankrWalletByFid(fid);
		}
		return null;
	}

	@Cacheable(value = BANKR_WALLETS_CACHE, key = "#fid", unless = "#result == null")
	public String getBankrWalletByFid(Integer fid) {
		log.debug("Calling Bankr API to fetch wallet for FID {}", fid);
		return webClient
				.get()
				.uri("https://api.bankr.bot/trading-wallet/" + fid)
				.retrieve()
				.onStatus(HttpStatus.NOT_FOUND::equals, clientResponse -> {
					log.debug("404 error when calling Bankr API for FID {}", fid);
					return Mono.empty();
				})
				.bodyToMono(BankrWalletResponse.class)
				.onErrorResume(WebClientResponseException.class, e -> {
					log.warn("Failed to fetch Bankr wallet for FID {}: {}", fid, e.getMessage());
					return Mono.empty();
				})
				.blockOptional()
				.map(BankrWalletResponse::getTradingWallet)
				.orElse(null);
	}

	@Cacheable(value = RODEO_WALLETS_CACHE, key = "#identity", unless = "#result == null")
	public String getRodeoWalletByIdentity(String identity) {
		val fid = getIdentityFid(identity);
		if (fid != null) {
			return getRodeoWalletByFid(fid);
		}
		return null;
	}

	@Cacheable(value = RODEO_WALLETS_CACHE, key = "#fid", unless = "#result == null")
	public String getRodeoWalletByFid(Integer fid) {
		log.debug("Calling Rodeo API to fetch wallet for FID {}", fid);

		String query = """
				{
				  userProfile(by: {fid: "%s"}) {
					username
					wallets{
					  address
					  connectorType
					}
				  }
				}
				""".formatted(fid);

		return webClient
				.post()
				.uri("https://api-v2.foundation.app/electric/v2/graphql")
				.bodyValue(Map.of("query", query))
				.retrieve()
				.bodyToMono(RodeoResponse.class)
				.map(response -> {
					if (response.getData() != null
							&& response.getData().getUserProfile() != null
							&& response.getData().getUserProfile().getWallets() != null) {
						return response.getData().getUserProfile().getWallets().stream()
								.filter(w -> w.getAddress() != null
										&& "smart_wallet".equals(w.getConnectorType()))
								.findFirst()
								.map(RodeoResponse.Wallet::getAddress)
								.map(String::toLowerCase)
								.orElse(null);
					}
					return null;
				})
				.onErrorResume(e -> {
					log.warn("Failed to fetch Rodeo wallet for FID {}: {}", fid, e.getMessage());
					return Mono.empty();
				})
				.block();
	}

	private List<String> verificationsWithoutCustodial(ConnectedAddresses verifications) {
		if (verifications == null) {
			return Collections.emptyList();
		}

		if (verifications.connectedAddresses().isEmpty()) {
			return Collections.singletonList(verifications.userAddress());
		}

		return verifications.connectedAddresses();
	}
}
