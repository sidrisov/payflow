package ua.sinaver.web3.payflow.service.api;

import org.springframework.retry.annotation.Retryable;
import ua.sinaver.web3.payflow.message.farcaster.Cast;
import ua.sinaver.web3.payflow.message.farcaster.CastResponseMessage;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;
import ua.sinaver.web3.payflow.message.farcaster.ValidatedFrameResponseMessage;
import ua.sinaver.web3.payflow.message.subscription.SubscribersMessage;
import ua.sinaver.web3.payflow.message.subscription.SubscriptionsCreatedMessage;

import java.util.List;

public interface IFarcasterNeynarService {

	@Retryable(maxAttempts = 5)
	ValidatedFrameResponseMessage validateFrameMessageWithNeynar(String frameMessageInHex);

	CastResponseMessage cast(String signer, String message, String parentHash,
	                         List<Cast.Embed> embeds);

	Cast fetchCastByHash(String hash);

	FarcasterUser fetchFarcasterUser(String custodyAddress);

	List<SubscriptionsCreatedMessage.Subscription> subscriptionsCreated(int fid);

	List<SubscribersMessage.Subscriber> subscribers(int fid);
}
