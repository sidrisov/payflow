package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.graphql.generated.types.FarcasterChannel;
import ua.sinaver.web3.payflow.graphql.generated.types.Wallet;
import ua.sinaver.web3.payflow.message.ConnectedAddresses;

public interface ISocialGraphService {

	void cleanIdentityVerifiedAddressesCache(String identity);

	ConnectedAddresses getIdentityVerifiedAddresses(String identity);

	void cleanCache(String identity);

	Wallet getSocialMetadata(String identity);

	FarcasterChannel getFarcasterChannelByChannelId(String channelId);
}
