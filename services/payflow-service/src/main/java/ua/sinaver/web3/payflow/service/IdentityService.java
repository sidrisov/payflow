package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.graphql.generated.types.Social;
import ua.sinaver.web3.payflow.graphql.generated.types.SocialDappName;
import ua.sinaver.web3.payflow.message.ConnectedAddresses;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.service.api.ISocialGraphService;

import java.time.Duration;
import java.util.*;

@Slf4j
@Service
@Transactional
public class IdentityService implements IIdentityService {

	@Autowired
	private InvitationRepository invitationRepository;

	@Autowired
	private UserRepository userRepository;
	@Autowired
	private ISocialGraphService socialGraphService;

	// reuse property to increase the contacts limit
	@Value("${payflow.invitation.whitelisted.default.users}")
	private Set<String> whitelistedUsers;

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
		val verifications = socialGraphService.getIdentityVerifiedAddresses(
				"fc_fid:".concat(String.valueOf(fid)));
		val addresses = verificationsWithoutCustodial(verifications);
		log.debug("Addresses for {}: {}", fid, addresses);
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
		return addresses.stream().map(address -> userRepository.findByIdentityAndAllowedTrue(address))
				.filter(Objects::nonNull).limit(3).toList();
	}

	@Override
	public String getFidFname(int fid) {
		val wallet = socialGraphService.getSocialMetadata(
				"fc_fid:".concat(String.valueOf(fid)));

		if (wallet == null) {
			log.warn("Username for {} was not found!", fid);
			return null;
		}

		val username = wallet.getSocials().stream()
				.filter(social -> social.getDappName().equals(SocialDappName.farcaster)
						&& social.getUserId().equals(String.valueOf(fid)))
				.findFirst().map(Social::getProfileName).orElse(null);
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

		val username = wallet.getSocials().stream()
				.filter(social -> social.getDappName().equals(SocialDappName.farcaster))
				.min(Comparator.comparing(Social::getIsFarcasterPowerUser).reversed()
						.thenComparing(Comparator.comparingInt(Social::getFollowerCount).reversed()))
				.map(Social::getProfileName).orElse(null);
		log.debug("Username for {}: {}", identity, username);
		return username;
	}

	@Override
	public String getIdentityFid(String identity) {
		log.debug("Fetching fid for: {}", identity);

		val wallet = socialGraphService.getSocialMetadata(identity);

		if (wallet == null) {
			log.warn("Fid for {} was not found!", identity);
			return null;
		}

		val fid = wallet.getSocials().stream()
				.filter(social -> social.getDappName().equals(SocialDappName.farcaster))
				.min(Comparator.comparing(Social::getIsFarcasterPowerUser).reversed()
						.thenComparing(Comparator.comparingInt(Social::getFollowerCount).reversed()))
				.map(Social::getUserId).orElse(null);
		log.debug("Fid for {}: {}", identity, fid);
		return fid;
	}

	@Override
	public List<IdentityMessage> getIdentitiesInfo(List<String> identities) {
		return getIdentitiesInfo(identities, null);
	}

	@Override
	public List<IdentityMessage> getIdentitiesInfo(List<String> identities, String me) {
		log.debug("Fetching {} identities", identities);
		try {
			val identityMessages = Flux
					.fromIterable(identities)
					.flatMap(identity -> Mono.zip(
											Mono.just(identity),
											Mono.fromCallable(
															() -> Optional.ofNullable(userRepository.findByIdentityAndAllowedTrue(identity)))
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
													}),
											Mono.fromCallable(
															() -> Optional.ofNullable(StringUtils.isNotBlank(me) ?
																	socialGraphService.getSocialInsights(identity, me) : null))
													.subscribeOn(Schedulers.boundedElastic())
													.onErrorResume(exception -> {
														log.error("Error fetching social insights" +
																		" for {} - {}",
																identity,
																exception.getMessage());
														return Mono.empty();
													}),
											// TODO: fetch only if social graph fetched
											Mono.fromCallable(
															() -> whitelistedUsers.contains(identity)
																	|| invitationRepository.existsByIdentityAndValid(identity))
													.onErrorResume(exception -> {
														log.error("Error checking invitation status for user {} - {}",
																identity,
																exception.getMessage());
														return Mono.empty();
													}))
									.map(tuple -> IdentityMessage.convert(
											identity,
											tuple.getT2().orElse(null),
											tuple.getT3(),
											tuple.getT4().orElse(null),
											tuple.getT5()))
							// TODO: fail fast, seems doesn't to work properly with threads
					)
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
}
