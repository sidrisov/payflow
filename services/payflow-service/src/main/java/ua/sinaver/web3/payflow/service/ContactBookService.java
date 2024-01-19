package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.graphql.client.ClientGraphQlResponse;
import org.springframework.graphql.client.GraphQlClient;
import org.springframework.graphql.client.HttpGraphQlClient;
import org.springframework.http.HttpHeaders;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.payflow.data.Contact;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.graphql.generated.types.SocialFollower;
import ua.sinaver.web3.payflow.graphql.generated.types.SocialFollowing;
import ua.sinaver.web3.payflow.graphql.generated.types.TokenTransfer;
import ua.sinaver.web3.payflow.graphql.generated.types.Wallet;
import ua.sinaver.web3.payflow.message.ContactMessage;
import ua.sinaver.web3.payflow.repository.ContactRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class ContactBookService implements IContactBookService {

	private final GraphQlClient graphQlClient;

	@Value("${payflow.airstack.contacts.update.period-in-hours:24}")
	private int contactsUpdatePeriod;

	@Value("${payflow.airstack.contacts.limit:10}")
	private int contactsLimit;
	@Autowired
	private ContactRepository contactRepository;

	@Autowired
	private UserRepository userRepository;

	public ContactBookService(@Value("${payflow.airstack.api.url}") String airstackUrl,
	                          @Value("${payflow.airstack.api.key}") String airstackApiKey) {
		WebClient client = WebClient.builder()
				.baseUrl(airstackUrl)
				.build();

		graphQlClient = HttpGraphQlClient.builder(client)
				.header(HttpHeaders.AUTHORIZATION, airstackApiKey)
				.build();
	}

	@Override
	public List<String> getAllFollowingContacts(String identity) {
		val topFollowings = graphQlClient.documentName("getSocialFollowings")
				.variable("identity", identity)
				.variable("limit", contactsLimit)
				.execute().block();

		if (topFollowings != null) {
			return topFollowings.field("SocialFollowings.Following")
					.toEntityList(SocialFollowing.class).stream()
					.map(f -> f.getFollowingAddress().getAddresses())
					.flatMap(List::stream)
					.distinct().limit(contactsLimit * 2L)
					.collect(Collectors.toList());
		} else {
			return Collections.emptyList();
		}
	}


	@Override
	public void update(ContactMessage contactMessage, User user) {
		val contact = contactRepository.findByUserAndIdentity(user, contactMessage.identity());
		if (contact != null) {
			// update only fields passed
			if (contactMessage.addressChecked() != null) {
				contact.setAddressChecked(contactMessage.addressChecked());
			}
			if (contactMessage.profileChecked() != null) {
				contact.setProfileChecked(contactMessage.profileChecked());
			}
		} else {
			contactRepository.save(ContactMessage.convert(contactMessage, user));
		}
	}

	@Override
	@Cacheable("contacts")
	public List<ContactMessage> getAllContacts(User user) {
		return contactRepository.findAllByUser(user).stream()
				.map(ContactMessage::convert).toList();
	}

	@Override
	@Cacheable(cacheNames = "socials")
	public Wallet getSocialMetadata(String identity, String me) {
		try {
			ClientGraphQlResponse socialMetadata = graphQlClient.documentName(
							"getSocialMetadataByIdentity")
					.variable("identity", identity)
					.variable("me", me)
					.execute().block();

			if (socialMetadata != null) {
				log.trace("socialMetadata: {}", socialMetadata);

				// TODO: some issue with projections, set manually
				val wallet = socialMetadata.field("Wallet").toEntity(Wallet.class);

				if (wallet != null) {
					val followings =
							socialMetadata.field("Wallet.socialFollowings.Following")
									.toEntityList(SocialFollowing.class);

					val followers =
							socialMetadata.field("Wallet.socialFollowers.Follower")
									.toEntityList(SocialFollower.class);

					val ethTransfers =
							socialMetadata.field("Wallet.ethTransfers")
									.toEntityList(TokenTransfer.class);
					val baseTransfers =
							socialMetadata.field("Wallet.baseTransfers")
									.toEntityList(TokenTransfer.class);

					wallet.getSocialFollowings().setFollowing(followings);
					wallet.getSocialFollowers().setFollower(followers);

					val tokenTransfers = new ArrayList<TokenTransfer>();
					tokenTransfers.addAll(ethTransfers);
					tokenTransfers.addAll(baseTransfers);
					wallet.setTokenTransfers(tokenTransfers);

				}
				return wallet;
			}
		} catch (Throwable t) {
			log.error("Error", t);
		}

		return null;
	}

	@Scheduled(fixedRate = 60000)
	public void updateContactsAtFixedRate() {
		log.debug("Updating contact list at {}", new Date());

		val staleBeforeDate =
				new Date(new Date().getTime() - TimeUnit.HOURS.toMillis(contactsUpdatePeriod));
		val users =
				userRepository.findByAllowedTrueAndLastUpdatedContactsBefore(staleBeforeDate);
		log.debug("Users with stale contacts: {}", users.stream().map(u -> u.getUsername()).toList());

		// TODO: for now update all, in future spin off a separate thread, batch, or via events
		for (val user : users) {
			try {
				val existingContactIdentities = contactRepository.findAllIdentitiesByUser(user);
				val followContacts =
						this.getAllFollowingContacts(user.getIdentity()).stream()
								.filter(address -> !existingContactIdentities.contains(address))
								.map(address -> new Contact(user, address)).toList();
				contactRepository.saveAll(followContacts);
				user.setLastUpdatedContacts(new Date());
			} catch (Throwable t) {
				log.error("Couldn't fetch following addresses", t);
			}
		}
	}

}
