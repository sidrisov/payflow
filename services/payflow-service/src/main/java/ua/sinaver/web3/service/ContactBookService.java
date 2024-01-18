package ua.sinaver.web3.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.graphql.client.ClientGraphQlResponse;
import org.springframework.graphql.client.GraphQlClient;
import org.springframework.graphql.client.HttpGraphQlClient;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.graphql.generated.types.SocialFollower;
import ua.sinaver.web3.graphql.generated.types.SocialFollowing;
import ua.sinaver.web3.graphql.generated.types.TokenTransfer;
import ua.sinaver.web3.graphql.generated.types.Wallet;
import ua.sinaver.web3.message.ContactMessage;
import ua.sinaver.web3.repository.ContactRepository;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
public class ContactBookService implements IContactBookService {

	private final GraphQlClient graphQlClient;
	@Value("${payflow.airstack.contacts.limit:10}")
	private int contactsLimit;
	@Autowired
	private ContactRepository contactRepository;

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
	@Cacheable(cacheNames = "socials")
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
			} else {
				log.error("NULL!!!");
			}
		} catch (Throwable t) {
			log.error("Error", t);
		}

		return null;
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

	// TODO: filter on db level
	@Override
	public List<ContactMessage> getAllContacts(User user) {
		val favouriteContacts = contactRepository.findAllByUser(user).stream()
				.map(ContactMessage::convert).toList();

		val favouriteContactAddresses =
				favouriteContacts.stream().map(ContactMessage::identity).toList();

		Stream<ContactMessage> followContactsStream = Stream.empty();
		try {
			followContactsStream =
					this.getAllFollowingContacts(user.getIdentity())
							.stream().filter(address -> !favouriteContactAddresses.contains(address))
							.map(address -> new ContactMessage(address, false, false));

		} catch (Throwable t) {
			log.error("Couldn't fetch following addresses", t);
		}

		return Stream.concat(favouriteContacts.stream(), followContactsStream).toList();
	}
}
