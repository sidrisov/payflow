package ua.sinaver.web3.payflow.service;

import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.extern.log4j.Log4j2;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.web3j.crypto.WalletUtils;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.data.UserAllowance;
import ua.sinaver.web3.payflow.message.FlowMessage;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.message.ProfileMessage;
import ua.sinaver.web3.payflow.message.WalletProfileRequestMessage;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.api.IUserService;

import java.util.*;
import java.util.regex.Pattern;

import static ua.sinaver.web3.payflow.config.CacheConfig.USERS_CACHE_NAME;

@Service
@Transactional
@Log4j2
public class UserService implements IUserService {

	private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]*$");
	private static final Integer WHITELISTED_FID_UPPER_RANGE = 30000;
	@Value("${payflow.invitation.allowance.enabled:false}")
	private boolean invitationAllowanceEnabled;
	@Value("${payflow.invitation.whitelisted.default.users}")
	private Set<String> defaultWhitelistedUsers;
	@Value("${payflow.invitation.default.allowance:10}")
	private int defaultInvitationAllowance;
	@Value("${payflow.favourites.limit:10}")
	private int defaultFavouriteContactLimit;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private InvitationRepository invitationRepository;
	@Autowired
	private IdentityService identityService;
	@Autowired
	private EntityManager entityManager;

	@Override
	@CacheEvict(value = USERS_CACHE_NAME)
	public void saveUser(String identity) {
		userRepository.save(new User(identity));
		entityManager.flush();
	}

	@Override
	@CacheEvict(value = USERS_CACHE_NAME, key = "#user.identity")
	public void saveUser(User user) {
		userRepository.save(user);
		entityManager.flush();
	}

	@Override
	@Transactional(value = Transactional.TxType.REQUIRES_NEW)
	public User getOrCreateUserFromFarcasterProfile(FarcasterUser farcasterUser,
	                                                boolean forceWhitelist,
	                                                boolean setDefaultReceivingAddress) {
		val verifications = farcasterUser.addressesWithoutCustodialIfAvailable();
		var profile = identityService.getProfiles(verifications)
				.stream().findFirst().orElse(null);
		if (profile == null && (forceWhitelist || farcasterUser.fid() <= WHITELISTED_FID_UPPER_RANGE || farcasterUser.powerBadge() || farcasterUser.username().endsWith(".eth"))) {
			val identityToCreateProfile = identityService.getIdentitiesInfo(verifications)
					.stream().max(Comparator.comparingInt(IdentityMessage::score))
					.orElse(null);
			if (identityToCreateProfile == null) {
				throw new IllegalStateException(String.format(
						"Can't create profile for: %s - identity is missing",
						farcasterUser.username())
				);
			}

			log.debug("Identity to create profile for interactor: {} : {}",
					farcasterUser,
					identityToCreateProfile);

			// fetch again for those who attempted to signed in
			profile = userRepository.findByIdentityIgnoreCase(identityToCreateProfile.address());
			if (profile == null) {
				profile = new User(identityToCreateProfile.address());
			}
			profile.setAllowed(true);
			profile.setUsername(farcasterUser.username().replace(".eth", ""));
			profile.setDisplayName(farcasterUser.displayName());
			profile.setProfileImage(farcasterUser.pfpUrl());
			if (setDefaultReceivingAddress) {
				profile.setDefaultReceivingAddress(identityToCreateProfile.address());
			}
			profile.setLastSeen(new Date());
			saveUser(profile);
		}
		return profile;
	}

	@Override
	public void updateLastSeen(User user) {
		user.setLastSeen(new Date());
		userRepository.save(user);
	}

	@Override
	@CacheEvict(value = USERS_CACHE_NAME, key = "#identity")
	public void updateProfile(String identity, ProfileMessage profile, String invitationCode) {
		User user = userRepository.findByIdentityIgnoreCase(identity);

		if (user == null) {
			throw new Error("User not found");
		}

		// 1. Check if user is whitelisted
		// 2. Check if invitation by signer or code exists
		// 2. Update invitation and user records
		// 4. Throw error if none
		// TODO: add roles later on instead
		if (!user.isAllowed()) {
			log.debug("Checking invitation for {} code {}", user, invitationCode);
			// TODO: remove whitelist logic as it prevents updating invitee field
			/*val whitelisted = !contactBookService.filterByInvited(
					Collections.singletonList(user.getIdentity().toLowerCase())).isEmpty();
			if (whitelisted) {
				user.setAllowed(true);
				user.setCreatedDate(new Date());
				val defaultAllowance = new UserAllowance(defaultInvitationAllowance,
						defaultInvitationAllowance, defaultFavouriteContactLimit);
				defaultAllowance.setUser(user);
				user.setUserAllowance(defaultAllowance);
			} else {*/
			val invitation = invitationRepository.findFirstValidByIdentityOrCode(identity,
					invitationCode);

			log.debug("Invitation: {} {} {}", invitation, identity, invitationCode);
			if (invitation != null) {
				user.setAllowed(true);
				user.setCreatedDate(new Date());
				invitation.setInvitee(user);
				invitation.setExpiryDate(null);
				if (invitationAllowanceEnabled) {
					val defaultUserAllowance = new UserAllowance(defaultInvitationAllowance,
							defaultInvitationAllowance, defaultFavouriteContactLimit);
					defaultUserAllowance.setUser(user);
					user.setUserAllowance(defaultUserAllowance);
				}
			} else {
				throw new Error("Access not allowed");
			}
		}

		if (profile != null) {
			user.setDisplayName(profile.displayName());
			if (WalletUtils.isValidAddress(profile.username())) {
				throw new Error("Username can't be an address");
			}

			if (!USERNAME_PATTERN.matcher(profile.username().toLowerCase()).matches()) {
				throw new Error("Username should be alphanumerical");
			}

			user.setUsername(profile.username().toLowerCase());
			user.setProfileImage(profile.profileImage());
			if (user.getDefaultFlow() == null && user.getDefaultReceivingAddress() == null &&
					profile.defaultFlow() != null) {
				val defaultFlow = FlowMessage.convert(profile.defaultFlow(), user);
				log.debug("Setting primary flow to: {}", defaultFlow);
				user.setDefaultFlow(defaultFlow);
			} else {
				// check if any extra wallets need to be added
			}

			// for now, only allow to update if not set
			if (user.getSigner() == null && profile.signer() != null) {
				user.setSigner(profile.signer());
			}
		}
	}

	@Override
	public User findByIdentity(String signer) {
		return userRepository.findByIdentityIgnoreCase(signer);
	}

	@Override
	public User findByUsername(String username) {
		return userRepository.findByUsernameOrIdentityIgnoreCase(username);
	}

	@Override
	public User findByUsernameOrIdentity(String usernameOrIdentity) {
		return userRepository.findByUsernameOrIdentityIgnoreCase(usernameOrIdentity);
	}

	@Override
	public List<User> searchByUsernameQuery(String query) {
		return userRepository.findBySearchQuery(query);
	}

	@Override
	public Map<WalletProfileRequestMessage, User> searchByOwnedWallets(List<WalletProfileRequestMessage> wallets) {
		// TODO: do lazy way for now, combine results within query later
		val walletUserMap = new HashMap<WalletProfileRequestMessage, User>();
		wallets.forEach(w -> {
			val user = userRepository.findByOwnedWallet(w);
			walletUserMap.put(w, user);
		});
		return walletUserMap;
	}

	@Override
	public List<User> findAll() {
		return userRepository.findByAllowedTrueOrderByLastSeenDesc();
	}

	@Override
	public User findByAccessToken(String accessToken) {
		return userRepository.findByAccessToken(accessToken);
	}

	@Override
	public void clearAccessToken(User user) {
		user.setAccessToken(null);
		userRepository.save(user);
	}

	@Override
	public String generateAccessToken(User user) {
		String accessToken = UUID.randomUUID().toString();
		user.setAccessToken(accessToken);
		return accessToken;
	}
}
