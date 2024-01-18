package ua.sinaver.web3.service;

import lombok.val;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.graphql.client.GraphQlClient;
import org.springframework.graphql.client.HttpGraphQlClient;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.graphql.generated.types.SocialFollowing;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContactBookService implements IContactBookService {

	private final GraphQlClient graphQlClient;
	@Value("${payflow.airstack.contacts.limit:10}")
	private int contactsLimit;

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
	public List<String> getAllContacts(String identity) {
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
}
