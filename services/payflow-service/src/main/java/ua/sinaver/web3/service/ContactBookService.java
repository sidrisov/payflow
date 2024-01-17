package ua.sinaver.web3.service;

import lombok.val;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.graphql.client.GraphQlClient;
import org.springframework.graphql.client.HttpGraphQlClient;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.data.gql.SocialFollowing;

import java.util.Collections;
import java.util.List;

@Service
public class ContactBookService implements IContactBookService {

    @Value("${payflow.airstack.contacts.limit:10}")
    private int contactsLimit;

    private final GraphQlClient graphQlClient;

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
        val top30FollowersMono = graphQlClient.documentName("getTop30FarcasterFollowings")
                .variable("identity", identity)
                .variable("limit", contactsLimit)
                .execute();
        val top30Followers = top30FollowersMono.block();

        if (top30Followers != null) {
            return top30Followers.field("SocialFollowings.Following")
                    .toEntityList(SocialFollowing.class).stream()
                    .map(f -> f.getFollowingAddress().getAddresses().getFirst())
                    .toList();
        } else {
            return Collections.emptyList();
        }
    }
}
