package ua.sinaver.web3.payflow.service.api;

import org.springframework.retry.annotation.Retryable;
import ua.sinaver.web3.payflow.message.*;

import java.util.List;

public interface IFarcasterHubService {

	@Retryable(maxAttempts = 5)
	ValidatedFarcasterFrameMessage validateFrameMessageWithNeynar(String frameMessageInHex);

	CastResponseMessage cast(String signer, String message, String parentHash,
	                         List<CastEmbed> embeds);

	@Retryable
	NotificationResponse getFidNotifications(int fid, String cursor);

	CastMessage fetchCastByHash(String hash);
}
