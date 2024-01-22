package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import ua.sinaver.web3.payflow.data.Contact;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.ContactMessage;
import ua.sinaver.web3.payflow.repository.ContactRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;

import java.time.Duration;
import java.time.Period;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

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
	@Autowired
	private ContactRepository contactRepository;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private ISocialGraphService socialGraphService;

	@Override
	public void update(ContactMessage contactMessage, User user) {
		var contact = contactRepository.findByUserAndIdentity(user, contactMessage.identity());
		if (contact == null) {
			contact = new Contact(user, contactMessage.identity());
		}

		var availableFavouriteLimit =
				user.getUserAllowance().getFavouriteContactLimit();

		if (availableFavouriteLimit == null) {
			availableFavouriteLimit = defaultFavouriteContactLimit;
		}

		// update only fields passed
		if (contactMessage.favouriteAddress() != null && contact.isAddressChecked() != contactMessage.favouriteAddress()) {
			if (contactMessage.favouriteAddress()) {
				if (availableFavouriteLimit == 0) {
					log.error("Favourite limit reached for user {}: {}", user.getUsername(), availableFavouriteLimit);
					throw new Error("Favourite limit reached");
				}
				contact.setAddressChecked(true);
				availableFavouriteLimit--;
			} else {
				contact.setAddressChecked(false);
				availableFavouriteLimit++;
			}
		}

		if (contactMessage.favouriteProfile() != null && contact.isProfileChecked() != contactMessage.favouriteProfile()) {
			if (contactMessage.favouriteProfile()) {
				if (availableFavouriteLimit == 0) {
					log.error("Favourite limit reached for user {}: {}", user.getUsername(), availableFavouriteLimit);
					throw new Error("Favourite limit reached");
				}
				contact.setProfileChecked(true);
				availableFavouriteLimit--;
			} else {
				contact.setProfileChecked(false);
				availableFavouriteLimit++;
			}
		}

		user.getUserAllowance().setFavouriteContactLimit(availableFavouriteLimit);
		contactRepository.save(contact);
	}

	@Override
	@Cacheable(value = "contacts", key = "#user.identity")
	public List<ContactMessage> getAllContacts(User user) {
		val contactMessages = Flux.fromIterable(contactRepository.findAllByUser(user))
				.flatMap(contact -> Mono.zip(
								Mono.fromCallable(() ->
										Optional.ofNullable(userRepository.findByIdentity(contact.getIdentity()))),
								Mono.fromCallable(() -> socialGraphService.getSocialMetadata(contact.getIdentity(), user.getIdentity()))
						)
						.subscribeOn(Schedulers.boundedElastic())
						.map(tuple -> ContactMessage.convert(
								contact,
								tuple.getT1().orElse(null),
								tuple.getT2())))
				.collectList()
				.block();

		if (log.isTraceEnabled()) {
			log.trace("Fetched {} contacts for {}: {}", contactMessages.size(), user.getUsername(),
					contactMessages.stream().map(c -> c.identity()).toList());
		} else {
			log.debug("Fetched {} contacts for {}", contactMessages.size(), user.getUsername());
		}

		return contactMessages;
	}

	@Scheduled(fixedRate = 60000)
	public void updateContactsAtFixedRate() {
		val lastUpdateDate =
				new Date(System.currentTimeMillis() - contactsUpdateDuration.toMillis());
		val lastSeenDate =
				new Date(System.currentTimeMillis() - TimeUnit.DAYS.toMillis(contactsUpdateLastSeenPeriod.getDays()));

		// find all allowed users which were active after some date and contacts weren't updated
		// since another date
		val users =
				userRepository.findByAllowedTrueAndLastUpdatedContactsBeforeAndLastSeenAfter(lastUpdateDate, lastSeenDate);

		if (log.isDebugEnabled()) {
			log.debug("Updating contacts list for profiles: {}",
					users.stream().map(User::getUsername).toList());
		}

		// TODO: for now update all, in future spin off a separate thread, batch, or via events
		for (val user : users) {
			try {
				val existingContactIdentities = contactRepository.findAllIdentitiesByUser(user);
				val followContacts =
						socialGraphService.getAllFollowingContacts(user.getIdentity()).stream()
								.filter(address -> !existingContactIdentities.contains(address))
								.map(address -> new Contact(user, address)).toList();
				contactRepository.saveAll(followContacts);
				user.setLastUpdatedContacts(new Date());

				if (log.isDebugEnabled()) {
					log.debug("Updated {} contacts for profile: {}",
							followContacts.size(), user.getUsername());
				}

			} catch (Throwable t) {
				log.error("Couldn't fetch following contacts for {}", user.getUsername(), t);
			}
		}
	}

}
