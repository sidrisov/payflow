package ua.sinaver.web3.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.val;
import lombok.extern.log4j.Log4j2;
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.FlowMessage;
import ua.sinaver.web3.message.ProfileMessage;
import ua.sinaver.web3.message.WalletProfileRequestMessage;
import ua.sinaver.web3.repository.UserRepository;

@Service
@Transactional
@Log4j2
public class UserService implements IUserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public void saveUser(String signer, String username) {
        userRepository.save(new User(signer, username));
    }

    @Override
    public void updateProfile(String signer, ProfileMessage profile) {
        User user = userRepository.findBySigner(signer);
        if (user != null && profile != null) {
            user.setDisplayName(profile.displayName());
            user.setUsername(profile.username().toLowerCase());
            user.setProfileImage(profile.profileImage());
            if (user.getDefaultFlow() == null && profile.defaultFlow() != null) {
                val defaultFlow = FlowMessage.convert(profile.defaultFlow(), user);
                user.setDefaultFlow(defaultFlow);
            }
        }
    }

    @Override
    public User findBySigner(String signer) {
        return userRepository.findBySigner(signer);
    }

    @Override
    public User findByUsername(String username) {
        return userRepository.findByUsernameOrSigner(username, username);
    }

    @Override
    public List<User> searchByUsernameQuery(String query) {
        return userRepository.findByDisplayNameContainingOrUsernameContainingOrSignerContaining(query, query, query);
    }

    @Override
    public Map<WalletProfileRequestMessage, User> searchByOwnedWallets(List<WalletProfileRequestMessage> wallets) {
        // TODO: do lazy way for now, combine results within query later
        var walletUserMap = new HashMap<WalletProfileRequestMessage, User>();
        wallets.stream().forEach(w -> {
            val user = userRepository.findByOwnedWallet(w);
            walletUserMap.put(w, user);
        });
        return walletUserMap;
    }
}
