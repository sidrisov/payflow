package ua.sinaver.web3.payflow.service;

import ua.sinaver.web3.payflow.graphql.generated.types.Wallet;

import java.util.List;

public interface ISocialGraphService {
	List<String> getAllFollowingContacts(String identity);

	Wallet getSocialMetadata(String identity, String me);
}
