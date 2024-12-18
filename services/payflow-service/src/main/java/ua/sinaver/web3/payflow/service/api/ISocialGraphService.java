package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.graphql.generated.types.FarcasterCast;
import ua.sinaver.web3.payflow.graphql.generated.types.FarcasterChannel;
import ua.sinaver.web3.payflow.graphql.generated.types.FarcasterFanTokenAuction;
import ua.sinaver.web3.payflow.graphql.generated.types.Wallet;
import ua.sinaver.web3.payflow.message.ConnectedAddresses;
import ua.sinaver.web3.payflow.message.moxie.FanToken;

import java.util.List;

public interface ISocialGraphService {
	List<String> getSocialFollowings(String identity);

	FarcasterCast getTopCastReply(String parentHash, List<String> ignoredFids);

	List<FarcasterFanTokenAuction> getFanTokenAuctions(List<String> farcasterUsernames);

	FanToken getFanToken(String name);

	boolean hasMoxiePass(String address);

	List<String> getFanTokenHolders(String fanTokenName);

	FarcasterCast getReplySocialCapitalValue(String hash);

	void cleanIdentityVerifiedAddressesCache(String identity);

	ConnectedAddresses getIdentityVerifiedAddresses(String identity);

	void cleanCache(String identity);

	Wallet getSocialMetadata(String identity);

	Wallet getSocialInsights(String identity, String me);

	FarcasterChannel getFarcasterChannelByChannelId(String channelId);
}
