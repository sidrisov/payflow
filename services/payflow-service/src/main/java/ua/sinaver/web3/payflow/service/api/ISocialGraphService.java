package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.graphql.generated.types.FarcasterCast;
import ua.sinaver.web3.payflow.graphql.generated.types.FarcasterFanTokenAuction;
import ua.sinaver.web3.payflow.graphql.generated.types.Wallet;
import ua.sinaver.web3.payflow.message.ConnectedAddresses;

import java.util.List;

public interface ISocialGraphService {
	List<String> getAllTokenOwners(String blockchain, String address);

	List<String> getSocialFollowings(String identity);

	FarcasterCast getTopCastReply(String parentHash, List<String> ignoredFids);

	List<FarcasterFanTokenAuction> getFanTokenAuctions(List<String> farcasterUsernames);

	FarcasterCast getReplySocialCapitalValue(String hash);

	ConnectedAddresses getIdentityVerifiedAddresses(String identity);

	void cleanCache(String identity);

	Wallet getSocialMetadata(String identity);

	Wallet getSocialInsights(String identity, String me);
}
