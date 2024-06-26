package ua.sinaver.web3.payflow.service.api;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.retry.annotation.Retryable;
import ua.sinaver.web3.payflow.message.farcaster.*;
import ua.sinaver.web3.payflow.message.subscription.SubscribersMessage;
import ua.sinaver.web3.payflow.message.subscription.SubscriptionsCreatedMessage;

import java.util.List;

import static ua.sinaver.web3.payflow.config.CacheConfig.NEYNAR_FARCASTER_USER_CACHE;

public interface IFarcasterNeynarService {

	StorageUsage fetchStorageUsage(int fid);

	@Retryable(maxAttempts = 5)
	ValidatedFrameResponseMessage validateFrameMessageWithNeynar(String frameMessageInHex);

	CastResponseMessage cast(String signer, String message, String parentHash,
	                         List<Cast.Embed> embeds);

	Cast fetchCastByHash(String hash);

	@Cacheable(value = NEYNAR_FARCASTER_USER_CACHE, unless = "#result==null")
	FarcasterUser fetchFarcasterUser(int fid);

	FarcasterUser fetchFarcasterUser(String custodyAddress);

	List<SubscriptionsCreatedMessage.Subscription> subscriptionsCreated(int fid);

	List<SubscribersMessage.Subscriber> subscribers(int fid);
}
