package ua.sinaver.web3.payflow.service.api;

import org.springframework.retry.annotation.Retryable;
import ua.sinaver.web3.payflow.message.CastEmbed;
import ua.sinaver.web3.payflow.message.CastMessage;
import ua.sinaver.web3.payflow.message.CastResponseMessage;
import ua.sinaver.web3.payflow.message.ValidatedFarcasterFrameMessage;
import ua.sinaver.web3.payflow.message.subscription.SubscribersMessage;
import ua.sinaver.web3.payflow.message.subscription.SubscriptionsCreatedMessage;

import java.util.List;

public interface IFarcasterNeynarService {

	@Retryable(maxAttempts = 5)
	ValidatedFarcasterFrameMessage validateFrameMessageWithNeynar(String frameMessageInHex);

	CastResponseMessage cast(String signer, String message, String parentHash,
	                         List<CastEmbed> embeds);

	CastMessage fetchCastByHash(String hash);

	List<SubscriptionsCreatedMessage.Subscription> subscriptionsCreated(int fid);

	List<SubscribersMessage.Subscriber> subscribers(int fid);
}
