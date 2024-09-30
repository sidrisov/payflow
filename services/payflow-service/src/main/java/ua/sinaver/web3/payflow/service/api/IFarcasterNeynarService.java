package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.message.farcaster.*;
import ua.sinaver.web3.payflow.message.subscription.SubscribersMessage;
import ua.sinaver.web3.payflow.message.subscription.SubscriptionsCreatedMessage;

import java.util.List;

public interface IFarcasterNeynarService {

	StorageUsage fetchStorageUsage(int fid);

	StorageAllocationsResponse fetchStorageAllocations(int fid);

	ValidatedFrameResponseMessage validateFrameMessageWithNeynar(String frameMessageInHex,
	                                                             boolean includeChannelContext);

	ValidatedFrameResponseMessage validateFrameMessageWithNeynar(String frameMessageInHex);

	CastResponseMessage cast(String signer, String message, String parentHash,
	                         List<Cast.Embed> embeds);

	Cast fetchCastByHash(String hash);

	List<FarcasterUser> fetchTop100Followings(int fid);

	FarcasterUser fetchFarcasterUser(int fid);

	FarcasterUser fetchFarcasterUser(String custodyAddress);

	List<SubscriptionsCreatedMessage.Subscription> subscriptionsCreated(int fid);

	List<SubscribersMessage.Subscriber> subscribers(int fid, boolean fabric);
}
