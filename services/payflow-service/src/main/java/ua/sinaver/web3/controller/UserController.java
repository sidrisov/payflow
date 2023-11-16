package ua.sinaver.web3.controller;

import java.security.Principal;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.val;
import lombok.extern.slf4j.Slf4j;
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.FlowMessage;
import ua.sinaver.web3.message.ProfileMessage;
import ua.sinaver.web3.message.ProfileMetaMessage;
import ua.sinaver.web3.message.WalletProfileRequestMessage;
import ua.sinaver.web3.message.WalletProfileResponseMessage;
import ua.sinaver.web3.service.UserService;

// TODO: remove Whitelabel Error Page
@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "${dapp.url}", allowCredentials = "true")
@Slf4j
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public ProfileMessage user(Principal principal) {
        log.trace("{}", principal);
        val user = userService.findBySigner(principal.getName());
        if (user != null) {
            return new ProfileMessage(user.getDisplayName(), user.getUsername(), user.getProfileImage(),
                    user.getSigner(),
                    user.getDefaultFlow() != null ? FlowMessage.convert(user.getDefaultFlow(), user)
                            : null);
        } else {
            return null;
        }
    }

    @PostMapping("/me")
    public void updateProfile(Principal principal, @RequestBody ProfileMessage profile) {
        log.debug("Update profile: {} by {}", profile, principal.getName());

        userService.updateProfile(principal.getName(), profile);

    }

    @GetMapping
    public List<ProfileMessage> searchProfile(@RequestParam(value = "search") String username) {
        List<User> users = userService.searchByUsernameQuery(username);
        log.debug("User: {} for {}", users, username);
        if (users != null) {
            return users.stream().map(user -> {
                return new ProfileMessage(user.getDisplayName(), user.getUsername(), user.getProfileImage(),
                        user.getSigner(),
                        user.getDefaultFlow() != null ? FlowMessage.convert(user.getDefaultFlow(), user)
                                : null);
            }).toList();

        } else {
            return null;
        }
    }

    @GetMapping("/{username}")
    public ProfileMessage findProfile(@PathVariable String username) {
        val user = userService.findByUsername(username);

        log.debug("User: {} for {}", user, username);
        if (user != null) {
            return new ProfileMessage(user.getDisplayName(), user.getUsername(), user.getProfileImage(),
                    user.getSigner(),
                    user.getDefaultFlow() != null ? FlowMessage.convert(user.getDefaultFlow(), user)
                            : null);
        } else {
            return null;
        }
    }

    @PostMapping("/search/wallets")
    public List<WalletProfileResponseMessage> findProfilesWithWallets(
            @RequestBody List<WalletProfileRequestMessage> wallets) {
        log.debug("Searching profiles by wallets: {}", wallets);

        if (wallets.isEmpty()) {
            return Collections.emptyList();
        }

        val walletUserMap = userService.searchByOwnedWallets(wallets);

        log.debug("Found profiles for owned wallets {} : {}", wallets, walletUserMap);

        // remove unnecessory information from the profiles (later on could be done on
        // sql level)
        return walletUserMap.entrySet().stream()
                .map(wu -> new WalletProfileResponseMessage(wu.getKey().address(), wu.getKey().network(),
                        wu.getValue() != null ? new ProfileMetaMessage(wu.getValue().getDisplayName(),
                                wu.getValue().getUsername(),
                                wu.getValue().getProfileImage()) : null))
                .collect(Collectors.toList());
    }
}
