package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.log4j.Log4j2;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.web3j.crypto.WalletUtils;
import ua.sinaver.web3.payflow.data.Invitation;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.data.UserAllowance;
import ua.sinaver.web3.payflow.message.FlowMessage;
import ua.sinaver.web3.payflow.message.ProfileMessage;
import ua.sinaver.web3.payflow.message.WalletProfileRequestMessage;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.api.IContactBookService;
import ua.sinaver.web3.payflow.service.api.IUserService;

import java.util.*;
import java.util.regex.Pattern;

import static ua.sinaver.web3.payflow.config.CacheConfig.USERS_CACHE_NAME;

@Service
@Transactional
@Log4j2
public class UserService implements IUserService {

	private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]*$");

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
	private IContactBookService contactBookService;

	@Override
	@CacheEvict(value = USERS_CACHE_NAME)
	public void saveUser(String identity) {
		userRepository.save(new User(identity));
	}

	@Override
	@CacheEvict(value = USERS_CACHE_NAME, key = "#identity")
	public void updateProfile(String identity, ProfileMessage profile, String invitationCode) {
		User user = userRepository.findByIdentity(identity);

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
			val whitelisted = !contactBookService.filterByInvited(
					Collections.singletonList(user.getIdentity().toLowerCase())).isEmpty();
			if (whitelisted) {
				user.setAllowed(true);
				user.setCreatedDate(new Date());
				val defaultAllowance = new UserAllowance(defaultInvitationAllowance,
						defaultInvitationAllowance, defaultFavouriteContactLimit);
				defaultAllowance.setUser(user);
				user.setUserAllowance(defaultAllowance);
			} else {
				Invitation invitation = invitationRepository.findFirstValidByIdentityOrCode(identity, invitationCode);
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
			if (user.getDefaultFlow() == null && profile.defaultFlow() != null) {
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
		return userRepository.findByIdentity(signer);
	}

	@Override
	public User findByUsername(String username) {
		return userRepository.findByUsernameOrIdentity(username);
	}

	@Override
	public User findByUsernameOrIdentity(String usernameOrIdentity) {
		return userRepository.findByUsernameOrIdentity(usernameOrIdentity);
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
}
