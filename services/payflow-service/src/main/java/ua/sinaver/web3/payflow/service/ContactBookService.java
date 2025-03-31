package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import ua.sinaver.web3.payflow.entity.Contact;
import ua.sinaver.web3.payflow.entity.User;
import ua.sinaver.web3.payflow.message.ContactMessage;
import ua.sinaver.web3.payflow.message.ContactsResponseMessage;
import ua.sinaver.web3.payflow.repository.ContactRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static ua.sinaver.web3.payflow.config.CacheConfig.CONTACTS_CACHE_NAME;

@Slf4j
@Service
public class ContactBookService {

	static {
		System.setProperty("reactor.schedulers.defaultBoundedElasticOnVirtualThreads", "true");
	}

	@Autowired
	private ContactRepository contactRepository;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private AirstackSocialGraphService socialGraphService;
	@Autowired
	private IdentitySubscriptionsService identitySubscriptionsService;
	@Autowired
	private IdentityFollowingsService identityFollowingsService;
	@Autowired
	private EthereumFollowProtocolService ethereumFollowProtocolService;
	@Autowired
	private IdentityService identityService;
	@Autowired
	private PaymentService paymentService;
	@Value("${payflow.airstack.contacts.fetch.timeout:60s}")
	private Duration contactsFetchTimeout;

	@Transactional
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

	@CacheEvict(cacheNames = CONTACTS_CACHE_NAME, key = "#user.identity")
	public void cleanContactsCache(User user) {
		log.debug("Evicting socials cache for {} key", user.getIdentity());
	}

	@Cacheable(value = CONTACTS_CACHE_NAME, key = "#user.identity", unless = "#result==null || #result.contacts.isEmpty()")
	public ContactsResponseMessage getAllContacts(User user) {
		log.debug("VIRTUAL {} {} {} {}", Schedulers.DEFAULT_BOUNDED_ELASTIC_ON_VIRTUAL_THREADS,
				Schedulers.DEFAULT_POOL_SIZE, Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
				Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE);

		val wallets = new ArrayList<>(identityService.getFarcasterAddressesByAddress(user.getIdentity()));

		log.debug("Fetched user's wallets: {}", wallets);

		val followings = identityFollowingsService.fetchFarcasterFollowings(user.getIdentity());
		log.debug("Fetched followings: {}", followings);

		val efpFollowings = ethereumFollowProtocolService.fetchFollowings(user.getIdentity());
		log.debug("Fetched EFP followings: {}", followings);

		val allPaymentRecipients = paymentService.getAllPaymentRecipients(user);
		val allPaymentUniqueRecipients = allPaymentRecipients.stream().distinct().toList();
		log.debug("Fetched payment recipients: {}", allPaymentUniqueRecipients);

		val recent = allPaymentUniqueRecipients.stream().limit(10).toList();
		log.debug("Fetched top 10 recent payment recipients: {}", recent);

		val popular = allPaymentRecipients.stream()
				.filter(identity -> !wallets.contains(identity))
				.collect(Collectors.groupingBy(identity -> identity,
						Collectors.counting()))
				.entrySet()
				.stream()
				.sorted(Map.Entry.<String, Long>comparingByValue().reversed())
				.limit(3)
				.map(Map.Entry::getKey)
				.toList();

		log.debug("Fetched top 3 popular payment recipients: {}", popular);

		// Temporarily disabled alfafrens subscribers
		/*
		 * val alfaFrensContacts =
		 * identitySubscriptionsService.fetchAlfaFrensSubscribers(user.getIdentity());
		 * log.debug("Fetched alfafrens subs: {}", alfaFrensContacts);
		 */
		val alfaFrensContacts = Collections.<String>emptyList();
		log.debug("Alfafrens subs disabled");

		val fabricContacts = identitySubscriptionsService.fetchFabricSubscribers(user.getIdentity());
		log.debug("Fetched fabric subs: {}", fabricContacts);

		// Temporarily disabled paragraph subscribers
		/*
		 * val paragraphContacts =
		 * identitySubscriptionsService.fetchParagraphSubscribers(user.getIdentity());
		 * log.debug("Fetched paragraph subs: {}", paragraphContacts);
		 */
		val paragraphContacts = Collections.<String>emptyList();
		log.debug("Paragraph subs disabled");

		val favourites = contactRepository.findByUserAndProfileCheckedTrue(user);
		val tags = new ArrayList<>(List.of("friends"));

		if (!efpFollowings.isEmpty()) {
			tags.add("efp");
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

		if (!favourites.isEmpty()) {
			tags.add("favourites");
		}

		val allContacts = Stream.of(
				popular.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "popular")),
				recent.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "recent")),
				allPaymentUniqueRecipients.stream()
						.map(identity -> new AbstractMap.SimpleEntry<>(identity, "transacted")),
				favourites.stream().map(contact -> new AbstractMap.SimpleEntry<>(contact.getIdentity(), "favourites")),
				followings.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "friends")),
				efpFollowings.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "efp")),
				fabricContacts.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "hypersub")),
				paragraphContacts.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "paragraph")),
				alfaFrensContacts.stream().map(identity -> new AbstractMap.SimpleEntry<>(identity, "alfafrens")))
				.flatMap(stream -> stream)
				.collect(Collectors.groupingBy(
						Map.Entry::getKey,
						Collectors.mapping(Map.Entry::getValue, Collectors.toList())));

		log.debug("All contacts[{}]: {}", allContacts.size(), allContacts);

		val contactIdentities = new ArrayList<>(allContacts.keySet());

		// Fetch all users in a single query
		val usersMap = userRepository.findAllByIdentityInIgnoreCase(contactIdentities)
				.stream()
				.collect(Collectors.toMap(u -> u.getIdentity().toLowerCase(), u -> u));

		try {
			val contactMessages = Flux
					.fromIterable(allContacts.keySet())
					.parallel()
					.runOn(Schedulers.boundedElastic())
					.flatMap(contact -> {
						log.debug("Processing contact: {} on thread: {} isVirtual: {}",
								contact,
								Thread.currentThread().getName(),
								Thread.currentThread().isVirtual());
						return Mono.zip(
								Mono.just(contact),
								Mono.justOrEmpty(usersMap.get(contact.toLowerCase())).singleOptional(),
								Mono.fromCallable(() -> {
									long start = System.currentTimeMillis();
									var result = socialGraphService.getSocialMetadata(contact);
									long executionTime = System.currentTimeMillis() - start;
									log.debug("Actual execution took {}ms for {}", executionTime, contact);
									return result;
								})
										.subscribeOn(Schedulers.boundedElastic())
										.elapsed()
										.doOnNext(tuple -> log.debug("Total time (including queue) took {}ms for {}",
												tuple.getT1(), contact))
										.map(tuple -> tuple.getT2()))
								.map(tuple -> ContactMessage.convert(
										tuple.getT1(),
										tuple.getT2().orElse(null),
										tuple.getT3(),
										allContacts.get(contact)));
					})
					// TODO: fail fast, seems doesn't to work properly with threads
					.sequential()
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
}
