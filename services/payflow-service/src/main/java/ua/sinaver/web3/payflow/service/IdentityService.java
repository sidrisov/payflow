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
import ua.sinaver.web3.payflow.entity.User;
import ua.sinaver.web3.payflow.graphql.generated.types.Social;
import ua.sinaver.web3.payflow.graphql.generated.types.SocialDappName;
import ua.sinaver.web3.payflow.message.ConnectedAddresses;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.message.farcaster.bankr.BankrWalletResponse;
import ua.sinaver.web3.payflow.message.farcaster.rodeo.RodeoResponse;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.service.api.ISocialGraphService;

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
	private ISocialGraphService socialGraphService;

	@Autowired
	private FarcasterNeynarService neynarService;

	public IdentityService(WebClient.Builder webClientBuilder) {
		this.webClient = webClientBuilder.build();
	}

	@Override
	public User getFidProfile(int fid, String identity) {
		val profiles = getProfiles(fid);
		return profiles.stream()
				.filter(p -> StringUtils.isBlank(identity) || p.getIdentity().equals(identity))
				.findFirst().orElse(null);
	}

	@Override
	public User getFidProfile(String fname, String identity) {
		val profiles = getProfiles(fname);
		return profiles.stream()
				.filter(p -> StringUtils.isBlank(identity) || p.getIdentity().equals(identity))
				.findFirst().orElse(null);
	}

	@Override
	public List<User> getProfiles(int fid) {
		return getProfiles(getFidAddresses(fid));
	}

	@Override
	public List<User> getProfiles(String fname) {
		return getProfiles(getFnameAddresses(fname));
	}

	@Override
	public List<String> getFidAddresses(int fid) {
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
	public List<String> getIdentityAddresses(String identity) {
		val verifications = socialGraphService.getIdentityVerifiedAddresses(identity);
		val addresses = verificationsWithoutCustodial(verifications);
		log.debug("Addresses for {}: {}", identity, addresses);
		return addresses;
	}

	@Override
	public String getENSAddress(String ens) {
		val wallet = socialGraphService.getSocialMetadata(ens);

		if (wallet == null || wallet.getAddresses() == null) {
			log.warn("ENS Address for {} was not found!", ens);
			return null;
		}

		String ensAddress = wallet.getAddresses().stream().findFirst().orElse(null);
		log.debug("ENS Address for {}: {}", ens, ensAddress);
		return ensAddress;
	}

	@Override
	public List<String> getFnameAddresses(String fname) {
		val verifications = socialGraphService.getIdentityVerifiedAddresses(
				"fc_fname:".concat(fname));
		val addresses = verificationsWithoutCustodial(verifications);
		log.debug("Addresses for {}: {}", fname, addresses);
		return addresses;
	}

	@Override
	public List<User> getProfiles(List<String> addresses) {
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
	public String getIdentityFname(String identity) {
		val wallet = socialGraphService.getSocialMetadata(identity);

		if (wallet == null) {
			log.warn("Username for {} was not found!", identity);
			return null;
		}

		if (wallet.getSocials() == null) {
			log.warn("Username for {} was not found - no socials!", identity);
			return null;
		}

		val username = wallet.getSocials().stream()
				.filter(social -> social.getDappName().equals(SocialDappName.farcaster))
				.min(/*
						 * Comparator.comparing(Social::getIsFarcasterPowerUser).reversed()
						 * .thenComparing(
						 */Comparator.comparingInt(Social::getFollowerCount).reversed())
				.map(Social::getProfileName).orElse(null);
		log.debug("Username for {}: {}", identity, username);
		return username;
	}

	@Override
	public String getFnameFid(String fname) {
		return getIdentityFid("fc_fname:".concat(fname));
	}

	@Override
	public String getIdentityFid(String identity) {
		log.debug("Fetching fid for: {}", identity);

		val wallet = socialGraphService.getSocialMetadata(identity);

		if (wallet == null) {
			log.warn("Fid for {} was not found!", identity);
			return null;
		}

		if (wallet.getSocials() == null) {
			log.warn("Fid for {} was not found - no socials!", identity);
			return null;
		}

		val fid = wallet.getSocials().stream()
				.filter(social -> social.getDappName().equals(SocialDappName.farcaster))
				.min(/*
						 * Comparator.comparing(Social::getIsFarcasterPowerUser).reversed()
						 * .thenComparing(
						 */Comparator.comparingInt(Social::getFollowerCount).reversed())
				.map(Social::getUserId).orElse(null);
		log.debug("Fid for {}: {}", identity, fid);
		return fid;
	}

	@Override
	public IdentityMessage getIdentityInfo(String identity) {
		val results = getIdentitiesInfo(Collections.singletonList(identity));
		return results.isEmpty() ? null : results.get(0);
	}

	@Override
	public List<IdentityMessage> getIdentitiesInfo(int fid) {
		val identities = getFidAddresses(fid);
		return getIdentitiesInfo(identities, null);
	}

	@Override
	public List<IdentityMessage> getIdentitiesInfo(List<String> identities) {
		return getIdentitiesInfo(identities, null);
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
	public List<IdentityMessage> getIdentitiesInfo(List<String> identities, String me) {
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
									tuple.getT3(),
									null)))
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
			return getBankrWalletByFid(Integer.parseInt(fid));
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
			return getRodeoWalletByFid(Integer.parseInt(fid));
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
