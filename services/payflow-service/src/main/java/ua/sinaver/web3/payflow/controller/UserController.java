package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.graphql.generated.types.Wallet;
import ua.sinaver.web3.payflow.message.*;
import ua.sinaver.web3.payflow.service.IContactBookService;
import ua.sinaver.web3.payflow.service.IFlowService;
import ua.sinaver.web3.payflow.service.ISocialGraphService;
import ua.sinaver.web3.payflow.service.IUserService;

import java.security.Principal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "${payflow.dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
public class UserController {

	@Autowired
	private IUserService userService;

	@Autowired
	private IFlowService flowService;

	@Autowired
	private IContactBookService contactBookService;

	@Autowired
	private ISocialGraphService socialGraphService;

	@GetMapping("/me")
	public ProfileMessage user(Principal principal) {
		log.trace("{} fetching its profile info", principal.getName());
		val user = userService.findByIdentity(principal.getName());

		if (user != null) {
			user.setLastSeen(new Date());

			return new ProfileMessage(user.getDisplayName(), user.getUsername(), user.getProfileImage(),
					user.getIdentity(),
					user.getSigner(),
					user.getDefaultFlow() != null ? FlowMessage.convert(user.getDefaultFlow(), user)
							: null,
					flowService.getAllFlows(user),
					user.getUserAllowance() != null ? user.getUserAllowance().getIdentityInviteLimit()
							: -1);
		} else {
			return null;
		}
	}

	@GetMapping("/me/contacts")
	public List<ContactMessage> contacts(Principal principal) {
		log.debug("{} fetching contacts", principal.getName());
		val user = userService.findByIdentity(principal.getName());
		if (user != null) {
			try {
				val contacts = contactBookService.getAllContacts(user);
				if (log.isTraceEnabled()) {
					log.trace("All contacts for {}: {}", principal.getName(), contacts);
				} else {
					log.debug("All contacts for {}: {}", principal.getName(),
							contacts.stream().map(ContactMessage::address).toList());
				}
				return contacts;
			} catch (Throwable t) {
				log.debug("Error fetching contacts for {}", user.getUsername(), t);
			}

		}

		return Collections.emptyList();
	}

	@GetMapping("/me/contacts/{identity}")
	public Wallet contacts(@PathVariable String identity, Principal principal) {
		log.trace("{} fetching contact identity {}", principal.getName(), identity);
		val user = userService.findByIdentity(principal.getName());
		if (user != null) {
			val metadata = socialGraphService.getSocialMetadata(identity, user.getIdentity());
			log.trace("Social Metadata for {}: {}", identity, metadata);
			return metadata;
		} else {
			throw new Error("User doesn't exist");
		}
	}

	@PostMapping("/me/favourites")
	public void updateFavouriteContact(Principal principal,
	                                   @RequestBody ContactMessage contactMessage) {
		log.trace("{} updates favourite contact {}", principal.getName(), contactMessage);
		val user = userService.findByIdentity(principal.getName());
		if (user != null) {
			contactBookService.update(contactMessage, user);
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
		usernames.forEach(username -> {
			users.addAll(userService.searchByUsernameQuery(username));
		});

		log.debug("User: {} for {}", users, usernames);
		// TODO: for now filter by whitelisted
		return users.stream().filter(user -> user.isAllowed() && user.getDefaultFlow() != null).map(user -> {
			return new ProfileMessage(user.getDisplayName(), user.getUsername(), user.getProfileImage(),
					user.getIdentity(),
					null,
					FlowMessage.convert(user.getDefaultFlow(), user),
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
					FlowMessage.convert(user.getDefaultFlow(), user),
					null,
					-1);
		} else {
			return null;
		}
	}

	@PostMapping("/search/wallets")
	public List<WalletProfileResponseMessage> findProfilesWithWallets(
			@RequestBody List<WalletProfileRequestMessage> wallets) {
		if (log.isTraceEnabled()) {
			log.trace("Searching profiles for wallets: {}", wallets);
		} else {
			log.debug("Searching profiles for {} wallets", wallets.size());
		}

		if (wallets.isEmpty()) {
			return Collections.emptyList();
		}

		val walletUserMap = userService.searchByOwnedWallets(wallets);

		if (log.isTraceEnabled()) {
			log.trace("Found profiles for wallets {} : {}", wallets, walletUserMap);
		} else {
			log.debug("Found profiles for {} wallets - {} profiles", wallets.size(),
					walletUserMap.size());
		}

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
