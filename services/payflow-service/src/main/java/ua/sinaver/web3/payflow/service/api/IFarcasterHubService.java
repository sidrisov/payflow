package ua.sinaver.web3.payflow.service.api;

import org.springframework.retry.annotation.Retryable;
import ua.sinaver.web3.payflow.message.CastRequestMessage;
import ua.sinaver.web3.payflow.message.CastResponseMessage;
import ua.sinaver.web3.payflow.message.NotificationResponse;
import ua.sinaver.web3.payflow.message.ValidatedFrameMessage;

import java.util.List;

public interface IFarcasterHubService {

	@Retryable(maxAttempts = 5)
	ValidatedFrameMessage validateFrameMessageWithNeynar(String frameMessageInHex);

	CastResponseMessage cast(String signer, String message, String parentHash,
	                         List<CastRequestMessage.Embed> embeds);

	@Retryable
	NotificationResponse getFidNotifications(int fid, String cursor);
}
