package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.graphql.generated.types.Wallet;
import ua.sinaver.web3.payflow.message.ConnectedAddresses;

import java.util.List;

public interface ISocialGraphService {
	List<String> getEthDenverParticipants();

	List<String> getSocialFollowings(String identity);

	ConnectedAddresses getIdentityConnectedAddresses(String identity);

	void cleanCache(String identity, String me);

	Wallet getSocialMetadata(String identity, String me);
}
