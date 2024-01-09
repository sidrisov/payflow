package ua.sinaver.web3.service;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.val;
import lombok.extern.log4j.Log4j2;
import ua.sinaver.web3.data.Invitation;
import ua.sinaver.web3.data.InvitationAllowance;
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.FlowMessage;
import ua.sinaver.web3.message.ProfileMessage;
import ua.sinaver.web3.message.WalletProfileRequestMessage;
import ua.sinaver.web3.repository.InvitationRepository;
import ua.sinaver.web3.repository.UserRepository;

@Service
@Transactional
@Log4j2
public class UserService implements IUserService {

    @Value("${payflow.invitation.allowance.enabled:false}")
    private boolean invitationAllowanceEnabled;

    @Value("${payflow.invitation.whitelisted.default.users}")
    private Set<String> defaultWhitelistedUsers;

    @Value("${payflow.invitation.whitelisted.default.allowance}")
    private int defaultWhitelistedAllowance;

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]*$");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InvitationRepository invitationRepository;

    @Override
    public void saveUser(String identity) {
        userRepository.save(new User(identity));
    }

    @Override
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

            log.debug("default whitelisted users {} and allowance {}", defaultWhitelistedUsers,
                    defaultWhitelistedAllowance);

            if (defaultWhitelistedUsers.contains(user.getIdentity())) {
                user.setAllowed(true);
                user.setCreatedDate(new Date());
                val defaultAllowance = new InvitationAllowance(defaultWhitelistedAllowance,
                        defaultWhitelistedAllowance);
                defaultAllowance.setUser(user);
                user.setInvitationAllowance(defaultAllowance);
            } else {
                Invitation invitation = invitationRepository.findFirstValidByIdentityOrCode(identity, invitationCode);
                if (invitation != null) {
                    user.setAllowed(true);
                    user.setCreatedDate(new Date());
                    invitation.setInvitee(user);
                    invitation.setExpiryDate(null);
                    if (invitationAllowanceEnabled) {
                        val defaultInvitationAllowance = new InvitationAllowance(1,
                                1);
                        defaultInvitationAllowance.setUser(user);
                        user.setInvitationAllowance(defaultInvitationAllowance);
                    }
                } else {
                    throw new Error("Access not allowed");
                }
            }
        }

        if (profile != null) {
            user.setDisplayName(profile.displayName());
            if (profile.username().toLowerCase().startsWith("0x")) {
                throw new Error("Username can't be an address");
            }

            if (!USERNAME_PATTERN.matcher(profile.username().toLowerCase()).matches()) {
                throw new Error("Username should be alphanumerical");
            }

            user.setUsername(profile.username().toLowerCase());
            user.setProfileImage(profile.profileImage());
            if (user.getDefaultFlow() == null && profile.defaultFlow() != null) {
                val defaultFlow = FlowMessage.convert(profile.defaultFlow(), user);
                user.setDefaultFlow(defaultFlow);
            } else {
                // check if any extra wallets need to be added
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
    public List<User> searchByUsernameQuery(String query) {
        return userRepository.findByDisplayNameContainingOrUsernameContainingOrIdentityContaining(query, query, query);
    }

    @Override
    public Map<WalletProfileRequestMessage, User> searchByOwnedWallets(List<WalletProfileRequestMessage> wallets) {
        // TODO: do lazy way for now, combine results within query later
        val walletUserMap = new HashMap<WalletProfileRequestMessage, User>();
        wallets.stream().forEach(w -> {
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
