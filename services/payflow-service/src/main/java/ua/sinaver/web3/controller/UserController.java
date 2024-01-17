package ua.sinaver.web3.controller;

import io.micrometer.core.annotation.Timed;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.*;
import ua.sinaver.web3.service.IContactBookService;
import ua.sinaver.web3.service.IFavouriteService;
import ua.sinaver.web3.service.IFlowService;
import ua.sinaver.web3.service.IUserService;

import java.security.Principal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "${dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
@Timed(value = "api.user")
public class UserController {

    @Autowired
    private IUserService userService;

    @Autowired
    private IFlowService flowService;

    @Autowired
    private IFavouriteService favouriteService;

    @Autowired
    private IContactBookService contactService;

    @GetMapping("/me")
    public ProfileMessage user(Principal principal) {
        log.trace("{}", principal);
        val user = userService.findByIdentity(principal.getName());

        if (user != null) {
            user.setLastSeen(new Date());

            return new ProfileMessage(user.getDisplayName(), user.getUsername(), user.getProfileImage(),
                    user.getIdentity(),
                    user.getSigner(),
                    user.getDefaultFlow() != null ? FlowMessage.convert(user.getDefaultFlow(), user)
                            : null,
                    flowService.getAllFlows(user),
                    user.getInvitationAllowance() != null ? user.getInvitationAllowance().getIdenityInviteLimit()
                            : -1);
        } else {
            return null;
        }
    }

    @GetMapping("/me/favourites")
    public List<FavouriteMessage> favourites(Principal principal) {
        log.trace("{}", principal);
        val user = userService.findByIdentity(principal.getName());
        if (user != null) {
            return favouriteService.getAllFavourites(user);
        } else {
            throw new Error("User doesn't exist");
        }
    }

    @GetMapping("/me/contacts")
    public List<String> contacts(Principal principal) {
        log.trace("{}", principal);
        val user = userService.findByIdentity(principal.getName());
        if (user != null) {
            val contacts = contactService.getAllContacts(user.getIdentity());
            log.trace("Social Contacts for {}: {}", principal.getName(), contacts);
            return contacts;
        } else {
            throw new Error("User doesn't exist");
        }
    }

    @PostMapping("/me/favourites")
    public void updateFavourite(Principal principal, @RequestBody FavouriteMessage favouriteMessage) {
        log.trace("{}", principal);
        val user = userService.findByIdentity(principal.getName());
        if (user != null) {
            favouriteService.update(favouriteMessage, user);
        } else {
            throw new Error("User doesn't exist");
        }
    }

    @PostMapping("/me")
    public void updateProfile(Principal principal, @RequestBody ProfileMessage profile,
            @RequestParam(required = false, name = "code") String invitationCode) {
        log.debug("Update profile: {} by {} with code {}", profile, principal.getName(), invitationCode);

        userService.updateProfile(principal.getName(), profile, invitationCode);

    }

    @GetMapping("/all")
    public List<ProfileMetaMessage> getAllProfiles() {
        List<User> users = userService.findAll();
        log.debug("Fetching all profiles");
        if (users != null) {
            return users.stream().map(user -> new ProfileMetaMessage(user.getIdentity(), user.getDisplayName(),
                    user.getUsername(),
                    user.getProfileImage(), user.getCreatedDate().toString(), null)).toList();
        } else {
            return Collections.emptyList();
        }
    }

    @GetMapping
    public List<ProfileMessage> searchProfile(@RequestParam(value = "search") List<String> usernames) {
        val users = new ArrayList<User>();

        // TODO: batch it in query
        usernames.stream().forEach(username -> {
            users.addAll(userService.searchByUsernameQuery(username));
        });

        log.debug("User: {} for {}", users, usernames);
        // TODO: for now filter by whitelisted
        return users.stream().filter(user -> user.isAllowed() && user.getDefaultFlow() != null).map(user -> {
            return new ProfileMessage(user.getDisplayName(), user.getUsername(), user.getProfileImage(),
                    user.getIdentity(),
                    null,
                    user.getDefaultFlow() != null ? FlowMessage.convert(user.getDefaultFlow(), user)
                            : null,
                    null,
                    -1);
        }).toList();
    }

    @GetMapping("/{username}")
    public ProfileMessage findProfile(@PathVariable String username) {
        val user = userService.findByUsername(username);

        log.debug("User: {} for {}", user, username);
        if (user != null && user.isAllowed() && user.getDefaultFlow() != null) {
            return new ProfileMessage(user.getDisplayName(), user.getUsername(), user.getProfileImage(),
                    user.getIdentity(),
                    null,
                    user.getDefaultFlow() != null ? FlowMessage.convert(user.getDefaultFlow(), user)
                            : null,
                    null,
                    -1);
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
                        wu.getValue() != null
                                ? new ProfileMetaMessage(wu.getValue().getIdentity(), wu.getValue().getDisplayName(),
                                        wu.getValue().getUsername(),
                                        wu.getValue().getProfileImage(),
                                        wu.getValue().getCreatedDate().toString(),
                                        wu.getValue().getDefaultFlow() != null
                                                ? FlowMessage.convert(wu.getValue().getDefaultFlow(), null)
                                                : null)
                                : null))
                .collect(Collectors.toList());
    }
}
