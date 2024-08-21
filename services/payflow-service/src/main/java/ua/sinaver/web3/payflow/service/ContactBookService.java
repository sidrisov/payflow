package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import ua.sinaver.web3.payflow.data.Contact;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.ContactMessage;
import ua.sinaver.web3.payflow.message.ContactsResponseMessage;
import ua.sinaver.web3.payflow.repository.ContactRepository;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.api.IContactBookService;
import ua.sinaver.web3.payflow.service.api.ISocialGraphService;

import java.time.Duration;
import java.time.Period;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static ua.sinaver.web3.payflow.config.CacheConfig.CONTACTS_CACHE_NAME;

@Slf4j
@Service
@Transactional
public class ContactBookService implements IContactBookService {

	@Value("${payflow.airstack.contacts.update.duration:24h}")
	private Duration contactsUpdateDuration;
	@Value("${payflow.airstack.contacts.update.last-seen-period:3d}")
	private Period contactsUpdateLastSeenPeriod;
	@Value("${payflow.favourites.limit:0}")
	private int defaultFavouriteContactLimit;

	@Value("${payflow.contacts.farcon.enabled:false}")
	private boolean farConContactsEnabled;
	@Autowired
	private ContactRepository contactRepository;

	@Autowired
	private InvitationRepository invitationRepository;

	@Autowired
	private UserRepository userRepository;
	@Autowired
	private ISocialGraphService socialGraphService;
	@Autowired
	private IdentitySubscriptionsService identitySubscriptionsService;

	@Autowired
	private IdentityFollowingsService identityFollowingsService;

	@Autowired
	private IdentityService identityService;

	@Autowired
	private FanTokenService fanTokenService;
	@Autowired
	private PaymentService paymentService;
	@Value("${payflow.airstack.contacts.limit:10}")
	private int contactsLimit;
	@Value("${payflow.airstack.contacts.fetch.timeout:30s}")
	private Duration contactsFetchTimeout;
	// reuse property to increase the contacts limit
	@Value("${payflow.invitation.whitelisted.default.users}")
	private Set<String> whitelistedUsers;
	private List<String> farConParticipants = new ArrayList<>();

	@Override
	@CacheEvict(value = CONTACTS_CACHE_NAME, key = "#user.identity")
	public void update(ContactMessage contactMessage, User user) {
		var contact = contactRepository.findByUserAndIdentity(user,
				contactMessage.data().address());
		if (contact == null) {
			contact = new Contact(user, contactMessage.data().address());
		}
		contact.setProfileChecked(contactMessage.tags().contains("favourites"));
		contactRepository.save(contact);
	}

	@Override
	@CacheEvict(cacheNames = CONTACTS_CACHE_NAME, key = "#user.identity")
	public void cleanContactsCache(User user) {
		log.debug("Evicting socials cache for {} key", user.getIdentity());
	}

	@Override
	@Cacheable(value = CONTACTS_CACHE_NAME, key = "#user.identity", unless = "#result==null")
	public ContactsResponseMessage getAllContacts(User user) {
		log.debug("VIRTUAL {} {} {} {}", Schedulers.DEFAULT_BOUNDED_ELASTIC_ON_VIRTUAL_THREADS,
				Schedulers.DEFAULT_POOL_SIZE, Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
				Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE);

		val verifications = identityService.getIdentityAddresses(user.getIdentity());
		log.debug("Fetched verifications: {}", verifications);

		val followings = identityFollowingsService.fetchFarcasterFollowings(user.getIdentity());
		log.debug("Fetched followings: {}", followings);

		val allPaymentRecipients = paymentService.getAllPaymentRecipients(user);
		val allPaymentUniqueRecipients = allPaymentRecipients.stream().distinct().toList();
		log.debug("Fetched payment recipients: {}", allPaymentUniqueRecipients);

		val recent = allPaymentUniqueRecipients.stream().limit(10).toList();
		log.debug("Fetched top 10 recent payment recipients: {}", recent);

		val popular = allPaymentRecipients.stream()
				.filter(identity -> !verifications.contains(identity))
				.collect(Collectors.groupingBy(identity -> identity,
						Collectors.counting()))
				.entrySet()
				.stream()
				.sorted(Map.Entry.<String, Long>comparingByValue().reversed())
				.limit(3)
				.map(Map.Entry::getKey)
				.toList();
		log.debug("Fetched top 3 popular payment recipients: {}", popular);

		val fanTokenContacts = fanTokenService.fetchFanTokenHolders(user.getIdentity());
		log.debug("Fetched fan token holders: {}", fanTokenContacts);

		val alfaFrensContacts = identitySubscriptionsService.fetchAlfaFrensSubscribers(user.getIdentity());
		log.debug("Fetched alfafrens subs: {}", alfaFrensContacts);

		val fabricContacts = identitySubscriptionsService.fetchFabricSubscribers(user.getIdentity());
		log.debug("Fetched fabric subs: {}", fabricContacts);

		val paragraphContacts = identitySubscriptionsService.fetchParagraphSubscribers(user.getIdentity());
		log.debug("Fetched paragraph subs: {}", paragraphContacts);

		val favourites = contactRepository.findByUserAndProfileCheckedTrue(user);
		val tags = new ArrayList<>(List.of("friends"));

		if (!verifications.isEmpty()) {
			tags.add("verifications");
		}

		if (!popular.isEmpty()) {
			tags.add("popular");
		}

		if (!recent.isEmpty()) {
			tags.add("recent");
		}

		if (!allPaymentUniqueRecipients.isEmpty()) {
			tags.add("transacted");
		}

		if (!alfaFrensContacts.isEmpty()) {
			tags.add("alfafrens");
		}

		if (!fabricContacts.isEmpty()) {
			tags.add("hypersub");
		}

		if (!paragraphContacts.isEmpty()) {
			tags.add("paragraph");
		}

		if (!fanTokenContacts.isEmpty()) {
			tags.add("moxie");
		}

		if (!favourites.isEmpty()) {
			tags.add("favourites");
		}

		val allContacts = Stream.of(
						verifications.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "verifications")),
						popular.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "popular")),
						recent.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "recent")),
						allPaymentUniqueRecipients.stream()
								.map(identity -> new AbstractMap.SimpleEntry<>(identity, "transacted")),
						favourites.stream().map(contact -> new AbstractMap.SimpleEntry<>(contact.getIdentity(), "favourites")),
						followings.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "friends")),
						fanTokenContacts.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "moxie")),
						fabricContacts.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "hypersub")),
						paragraphContacts.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "paragraph")),
						alfaFrensContacts.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "alfafrens")))
				.flatMap(stream -> stream)
				.collect(Collectors.groupingBy(
						Map.Entry::getKey,
						Collectors.mapping(Map.Entry::getValue, Collectors.toList())));

		log.debug("All contacts[{}]: {}", allContacts.size(), allContacts);

		val invited = filterByInvited(allContacts.keySet().stream().toList());

		try {
			val contactMessages = Flux
					.fromIterable(allContacts.keySet())
					.flatMap(contact -> Mono.zip(
											Mono.just(contact),
											Mono.justOrEmpty(userRepository.findByIdentity(contact)).singleOptional(),
											Mono.fromCallable(
															() -> socialGraphService.getSocialMetadata(contact))
													.subscribeOn(Schedulers.boundedElastic())
													.onErrorResume(exception -> {
														log.error("Error fetching social graph for {} - {}",
																contact,
																exception.getMessage());
														return Mono.empty();
													}),
											Mono.fromCallable(
															() -> socialGraphService.getSocialInsights(contact,
																	user.getIdentity()))
													.subscribeOn(Schedulers.boundedElastic())
													.onErrorResume(exception -> {
														log.error("Error fetching social insights" +
																		" for {} - {}",
																contact,
																exception.getMessage());
														return Mono.empty();
													}),
											Mono.fromCallable(
															() -> invited.contains(contact))
													.onErrorResume(exception -> {
														log.error("Error checking invitation status for user {} - {}",
																contact,
																exception.getMessage());
														return Mono.empty();
													}))
									.map(tuple -> ContactMessage.convert(
											tuple.getT1(),
											tuple.getT2().orElse(null),
											tuple.getT3(),
											tuple.getT4(),
											tuple.getT5(),
											allContacts.get(contact)))
							// TODO: fail fast, seems doesn't to work properly with threads
					)
					.timeout(contactsFetchTimeout, Mono.empty())
					.collectList()
					.block();

			if (log.isTraceEnabled()) {
				log.trace("Fetched {} contacts for {}: {}", contactMessages.size(), user.getUsername(),
						contactMessages.stream().map(c -> c.data().address()).toList());
			} else {
				log.debug("Fetched {} contacts for {}", contactMessages.size(), user.getUsername());
			}
			return new ContactsResponseMessage(tags, contactMessages);
		} catch (Throwable t) {
			log.error("Failed to fetch contacts", t);
			return null;
		}
	}

	// @Scheduled(fixedRate = 60 * 1000)
	public void updateContactsAtFixedRate() {
		val lastUpdateDate = new Date(System.currentTimeMillis() - contactsUpdateDuration.toMillis());
		val lastSeenDate = new Date(
				System.currentTimeMillis() - TimeUnit.DAYS.toMillis(contactsUpdateLastSeenPeriod.getDays()));
		// find all allowed users which were active after some date
		// and contacts weren't updated since another date
		val users = userRepository.findTop5ByAllowedTrueAndLastUpdatedContactsBeforeAndLastSeenAfter(lastUpdateDate,
				lastSeenDate);

		if (log.isDebugEnabled()) {
			log.debug("Updating contacts list for profiles: {}",
					users.stream().map(User::getUsername).toList());
		}

		// TODO: for now update all, in future spin off a separate thread, batch, or via
		// events
		for (val user : users) {
			try {
				val existingContactIdentities = contactRepository.findAllIdentitiesByUser(user);
				val followContacts = socialGraphService.getSocialFollowings(user.getIdentity()).stream()
						.filter(address -> !existingContactIdentities.contains(address))
						.map(address -> new Contact(user, address)).toList();
				contactRepository.saveAll(followContacts);

				if (log.isDebugEnabled()) {
					log.debug("Updated {} contacts for profile: {}",
							followContacts.size(), user.getUsername());
				}

			} catch (Throwable t) {
				if (log.isTraceEnabled()) {
					log.error("Couldn't fetch following contacts for {}, error: {}",
							user.getUsername(),
							t.getMessage(), t);
				} else {
					log.error("Couldn't fetch following contacts for {}, error: {}",
							user.getUsername(),
							t.getMessage());
				}
			}

			// TODO: temp hack to stop fetching, add fetch status
			user.setLastUpdatedContacts(new Date());
		}
	}

	@Override
	public List<String> filterByInvited(List<String> addresses) {
		log.debug("Whitelisted {}", whitelistedUsers);
		var whitelistedAddresses = addresses.stream()
				.filter(address -> whitelistedUsers.contains(address.toLowerCase())
						|| farConParticipants.contains(address.toLowerCase()))
				.toList();
		log.debug("Whitelisted addresses {} {}", addresses, whitelistedUsers);

		val notWhitelisted = addresses.stream()
				.filter(address -> !whitelistedAddresses.contains(address.toLowerCase()))
				.toList();
		val invitations = invitationRepository.existsByIdentityInAndValid(
				notWhitelisted);
		return Stream.concat(whitelistedAddresses.stream(),
				invitations.keySet().stream()).collect(Collectors.toList());
	}

	// run only once
	@Scheduled(fixedRate = Long.MAX_VALUE)
	// @CacheEvict(cacheNames = {ETH_DENVER_PARTICIPANTS_CACHE_NAME,
	// ETH_DENVER_PARTICIPANTS_POAP_CACHE_NAME},
	// beforeInvocation = true,
	// allEntries = true)
	public void preFetchFarConParticipants() {
		if (!farConContactsEnabled) {
			return;
		}

		if (log.isDebugEnabled()) {
			log.debug("Fetching FarCon participants list");
		}

		try {
			val farConParticipants = socialGraphService.getAllTokenOwners("base",
					"0x43ad2d5bd48de6d20530a48b5c357e26459afb3c");

			if (log.isDebugEnabled()) {
				log.debug("Fetched FarCon participants: {}",
						log.isTraceEnabled() ? farConParticipants : farConParticipants.size());
			}

			this.farConParticipants = farConParticipants;
		} catch (Throwable t) {
			log.error("Couldn't fetch FarCon participants {}, {}", t.getMessage(),
					log.isTraceEnabled() ? t : null);
		}
	}
}
