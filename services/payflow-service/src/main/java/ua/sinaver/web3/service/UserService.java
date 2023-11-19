package ua.sinaver.web3.service;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InvitationRepository invitationRepository;

    @Override
    public void saveUser(String signer, String username) {
        userRepository.save(new User(signer, username));
    }

    @Override
    public void updateProfile(String signer, ProfileMessage profile, String invitationCode) {
        User user = userRepository.findBySigner(signer);

        if (user == null) {
            throw new Error("User not found");
        }

        // 1. Check if user is whitelisted
        // 2. Check if invitation by signer or code exists
        // 2. Update invitation and user records
        // 4. Throw error if none
        // TODO: add roles later on instead
        if (!user.getAllowed()) {
            log.debug("Checking invitation for {} code {}", user, invitationCode);

            if (user.getSigner().equals("0x0dEe77c83cB8b14fA95497825dF93202AbF6ad83")) {
                user.setAllowed(true);
                user.setCreatedDate(new Date());
                user.setInvitationAllowance(new InvitationAllowance(100, 100));
            } else {
                Invitation invitation = invitationRepository.findFirstValidByIdentityOrCode(signer, invitationCode);
                if (invitation != null) {
                    user.setAllowed(true);
                    user.setCreatedDate(new Date());
                    invitation.setInvitee(user);
                    invitation.setExpiryDate(null);
                    user.setInvitationAllowance(new InvitationAllowance(1, 1));
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
    public User findBySigner(String signer) {
        return userRepository.findBySigner(signer);
    }

    @Override
    public User findByUsername(String username) {
        return userRepository.findByUsernameOrSigner(username);
    }

    @Override
    public List<User> searchByUsernameQuery(String query) {
        return userRepository.findByDisplayNameContainingOrUsernameContainingOrSignerContaining(query, query, query);
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
}
