package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import ua.sinaver.web3.payflow.client.NeynarClient;
import ua.sinaver.web3.payflow.dto.FlowMessage;
import ua.sinaver.web3.payflow.dto.ProfileMessage;
import ua.sinaver.web3.payflow.dto.ProfileMetaMessage;
import ua.sinaver.web3.payflow.entity.PreferredTokens;
import ua.sinaver.web3.payflow.entity.User;
import ua.sinaver.web3.payflow.message.*;
import ua.sinaver.web3.payflow.message.farcaster.StorageUsage;
import ua.sinaver.web3.payflow.message.subscription.Subscription;
import ua.sinaver.web3.payflow.service.ContactBookService;
import ua.sinaver.web3.payflow.service.FarcasterNeynarService;
import ua.sinaver.web3.payflow.service.FlowService;
import ua.sinaver.web3.payflow.service.UserService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.service.AirstackSocialGraphService;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = { "${payflow.dapp.url}" }, allowCredentials = "true")
@Transactional
@Slf4j
public class UserController {

	@Autowired
	private UserService userService;

	@Autowired
	private FlowService flowService;

	@Autowired
	private ContactBookService contactBookService;

	@Autowired
	private AirstackSocialGraphService socialGraphService;

	@Autowired
	private IIdentityService identityService;

	@Autowired
	private FarcasterNeynarService neynarService;

	@Autowired
	private NeynarClient neynarClient;

	@GetMapping("/me")
	public ProfileMessage user(@AuthenticationPrincipal String identity) {
		log.trace("{} fetching its profile info", identity);
		val user = userService.findByIdentity(identity);
		if (user != null) {
			userService.updateLastSeen(user);
			return new ProfileMessage(user.getDisplayName(), user.getUsername(), user.getProfileImage(),
					user.getIdentity(),
					user.getSigner(),
					FlowMessage.convertDefaultFlow(user, true),
					flowService.getAllFlows(user),
					Optional.ofNullable(user.getPreferredTokens())
							.map(PreferredTokens::getTokenList)
							.orElse(Collections.emptyList()),
					user.getPreferredFarcasterClient(),
					userService.getEarlyFeatureAccessUsers().contains(user.getUsername()),
					userService.getProFeatureAccessUsers().contains(user.getUsername()));
		} else {
			return null;
		}
	}

	@GetMapping("/me/contacts")
	public ContactsResponseMessage allContacts(@AuthenticationPrincipal String identity,
			@RequestHeader(value = "Cache-Control", required = false) String cacheControl) {
		log.debug("{} fetching contacts", identity);
		val user = userService.findByIdentity(identity);
		if (user != null) {
			try {
				if (StringUtils.equals(cacheControl, "no-cache")) {
					log.debug("{} cleaning contacts cache", identity);
					// contactBookService.cleanContactsCache(user);
				}
				val response = contactBookService.getAllContacts(user);
				if (log.isTraceEnabled()) {
					log.trace("All contacts for {}: {}", identity, response.contacts());
				} else {
					log.debug("All contacts for {}: {}", identity,
							response.contacts().size());
				}
				return response;
			} catch (Throwable t) {
				log.debug("Error fetching contacts for {}", identity, t);
			}
		}

		return new ContactsResponseMessage(Collections.emptyList(), Collections.emptyList());
	}

	@PostMapping("/me/favourites")
	public void updateFavouriteContact(@AuthenticationPrincipal String identity,
			@RequestBody ContactMessage contactMessage) {
		log.trace("{} updates favourite contact {}", identity, contactMessage);
		val user = userService.findByIdentity(identity);
		if (user != null) {
			contactBookService.update(contactMessage, user);
		} else {
			throw new Error("User doesn't exist");
		}
	}

	@PostMapping("/me")
	public void updateProfile(@AuthenticationPrincipal String identity, @RequestBody ProfileMessage profile,
			@RequestParam(required = false, name = "code") String invitationCode) {
		log.debug("Update profile: {} by {} with code {}", profile, identity, invitationCode);

		userService.updateProfile(identity, profile, invitationCode);

	}

	@GetMapping("/me/subscribedTo")
	public ResponseEntity<List<Subscription>> getSubscriptions(@AuthenticationPrincipal String identity) {
		val user = userService.findByIdentity(identity);
		if (user == null) {
			throw new Error("User doesn't exist");
		}

		val fid = identityService.getIdentityFid(user.getIdentity());
		if (fid == null) {
			throw new Error("User doesn't have a FID");
		}

		try {
			val subscribedTo = neynarClient.getSubscribedTo(fid);
			log.debug("Subscribed to for {}: {}", fid, subscribedTo);
			return ResponseEntity.ok(subscribedTo.subscribedTo());
		} catch (Throwable t) {
			log.error("Error fetching subscribedTo for {}", fid, t);
			return ResponseEntity.internalServerError().build();
		}
	}

	@GetMapping("/all")
	// @Cacheable(cacheNames = USERS_CACHE_NAME, unless = "#result.isEmpty()")
	public List<ProfileMetaMessage> getAllProfiles() {
		try {
			List<User> users = userService.findAll();
			log.debug("Fetching all profiles");
			if (users != null) {
				return users.stream().map(user -> ProfileMetaMessage.convert(user, false)).toList();
			}
		} catch (Throwable t) {
			log.error("Error fetching all profiles: ", t);
		}

		return Collections.emptyList();
	}

	@GetMapping("/identities")
	public List<IdentityMessage> getIdentities(@RequestParam(required = false) List<String> identities,
			@RequestParam(required = false) Integer fid) {
		try {
			if (identities != null) {
				return identityService.getIdentitiesInfo(identities);

			} else if (fid != null) {
				return identityService.getIdentitiesInfo(fid);
			}
		} catch (Throwable t) {
			log.error("Error fetching identities: {}", identities, t);
		}
		return Collections.emptyList();
	}

	@GetMapping({ "/identities/{usernameOrAddress}", "/identities/fid/{fid}" })
	public ResponseEntity<IdentityMessage> getIdentity(@AuthenticationPrincipal String identity,
			@PathVariable(required = false) String usernameOrAddress,
			@PathVariable(required = false) Integer fid) {
		log.debug("Fetching identity info: {} or {}", usernameOrAddress, fid);

		if (StringUtils.isBlank(usernameOrAddress) && fid == null) {
			return ResponseEntity.badRequest().build();
		}

		try {
			List<String> identities = new ArrayList<>();
			if (StringUtils.isNotBlank(usernameOrAddress)) {
				if (usernameOrAddress.endsWith(".eth") || usernameOrAddress.endsWith(".cb.id")) {
					val ensAddress = identityService.getENSAddress(usernameOrAddress);
					if (ensAddress != null) {
						identities.add(ensAddress);
					} else {
						return ResponseEntity.notFound().build();
					}
				} else if (usernameOrAddress.startsWith("0x")) {
					identities.add(usernameOrAddress);
				} else {
					val user = userService.findByUsernameOrIdentity(usernameOrAddress);
					if (user != null && user.isAllowed()) {
						identities.add(user.getIdentity());
					} else {
						val fnameAddresses = identityService.getFarcasterAddressesByUsername(usernameOrAddress);
						if (fnameAddresses != null && !fnameAddresses.isEmpty()) {
							identities.addAll(fnameAddresses);
						} else {
							return ResponseEntity.notFound().build();
						}
					}
				}
			} else {
				val fidAddresses = identityService.getFarcasterAddressesByFid(fid);
				if (fidAddresses != null && !fidAddresses.isEmpty()) {
					identities.addAll(fidAddresses);
				} else {
					return ResponseEntity.notFound().build();
				}
			}

			val identityInfo = identityService.getIdentitiesInfo(identities)
					.stream()
					.max(Comparator.comparingInt(IdentityMessage::score))
					.orElse(null);
			log.debug("Fetched identity info: {} for {}", identityInfo, identities);
			return ResponseEntity.ok(identityInfo);
		} catch (Throwable t) {
			log.error("Error fetching identity: {}", usernameOrAddress, t);
			return ResponseEntity.internalServerError().build();
		}
	}

	@GetMapping("/storage/fid/{fid}")
	public ResponseEntity<StorageUsage> getFidStorageUsage(@PathVariable Integer fid) {
		log.debug("Fetching storage usage for {}", fid);

		if (fid == null) {
			return ResponseEntity.badRequest().build();
		}

		// Validate that FID is a positive number and not too large
		if (fid <= 0 || fid > 10_000_000) { // Assuming reasonable FID range
			log.error("Invalid FID value: {}", fid);
			return ResponseEntity.badRequest().build();
		}

		try {
			val storageUsage = neynarService.fetchStorageUsage(fid);
			val storageAllocations = neynarService.fetchStorageAllocations(fid);
			if (storageUsage != null && storageAllocations != null) {
				val storageUsageWithSoonExpireUnits = storageUsage.withSoonExpireUnits(storageAllocations);
				log.debug("Fetched storage usage & allocations for {}: {}", fid, storageUsageWithSoonExpireUnits);
				return ResponseEntity.ok(storageUsage.withSoonExpireUnits(storageAllocations));
			} else {
				log.error("Storage usage not found for {}", fid);
				return ResponseEntity.notFound().build();
			}
		} catch (Throwable t) {
			log.error("Error fetching storage usage for {}", fid, t);
			return ResponseEntity.internalServerError().build();
		}
	}

	@GetMapping("/me/storage")
	public ResponseEntity<StorageUsage> getStorageUsage(@AuthenticationPrincipal String identity) {
		if (StringUtils.isBlank(identity)) {
			log.error("User not authenticated!");
			return ResponseEntity.badRequest().build();
		}

		val user = userService.findByUsername(identity);
		if (user == null) {
			log.error("User not found!");
			return ResponseEntity.badRequest().build();
		}

		log.debug("Fetching storage for {}", identity);

		val fid = identityService.getIdentityFid(user.getIdentity());
		if (fid == null) {
			return ResponseEntity.badRequest().build();
		}

		try {
			val storageUsage = neynarService.fetchStorageUsage(fid);
			val storageAllocations = neynarService.fetchStorageAllocations(fid);
			if (storageUsage != null && storageAllocations != null) {
				val storageUsageWithSoonExpireUnits = storageUsage.withSoonExpireUnits(storageAllocations);
				log.debug("Fetched storage usage & allocations for {}: {}", fid, storageUsageWithSoonExpireUnits);
				return ResponseEntity.ok(storageUsage.withSoonExpireUnits(storageAllocations));
			} else {
				log.error("Storage usage not found for {}", fid);
				return ResponseEntity.notFound().build();
			}
		} catch (Throwable t) {
			log.error("Error fetching storage usage for {}", fid, t);
			return ResponseEntity.internalServerError().build();
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
		return users.stream()
				.filter(user -> user.isAllowed()
						&& (user.getDefaultFlow() != null || user.getDefaultReceivingAddress() != null))
				.map(user -> new ProfileMessage(user.getDisplayName(), user.getUsername(), user.getProfileImage(),
						user.getIdentity(),
						null,
						FlowMessage.convertDefaultFlow(user, false),
						null,
						Optional.ofNullable(user.getPreferredTokens())
								.map(PreferredTokens::getTokenList)
								.orElse(Collections.emptyList()),
						null,
						false, false))
				.toList();
	}

	@CrossOrigin(origins = "*", allowCredentials = "false")
	@GetMapping("/{username}")
	public ProfileMessage findProfile(@PathVariable String username) {
		val user = userService.findByUsername(username);

		log.debug("User: {} for {}", user, username);
		if (user != null && user.isAllowed()
				&& (user.getDefaultFlow() != null || user.getDefaultReceivingAddress() != null)) {
			return new ProfileMessage(user.getDisplayName(), user.getUsername(), user.getProfileImage(),
					user.getIdentity(),
					null,
					FlowMessage.convertDefaultFlow(user, false),
					null,
					Optional.ofNullable(user.getPreferredTokens())
							.map(PreferredTokens::getTokenList)
							.orElse(Collections.emptyList()),
					null,
					false, false);
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

		// remove unnecessary information from the profiles (later on could be done on
		// sql level)
		return walletUserMap.entrySet().stream()
				.map(wu -> new WalletProfileResponseMessage(wu.getKey().address(), wu.getKey().network(),
						wu.getValue() != null
								? ProfileMetaMessage.convert(wu.getValue(), true)
								: null))
				.collect(Collectors.toList());
	}
}
