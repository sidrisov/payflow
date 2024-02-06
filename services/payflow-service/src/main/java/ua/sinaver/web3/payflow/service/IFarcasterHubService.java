package ua.sinaver.web3.payflow.service;

import org.springframework.retry.annotation.Retryable;
import ua.sinaver.web3.payflow.message.ValidatedFrameMessage;
import ua.sinaver.web3.payflow.message.ValidatedMessage;

public interface IFarcasterHubService {
	ValidatedMessage validateFrameMessage(String frameMessageInHex);

	@Retryable(maxAttempts = 5)
	ValidatedFrameMessage validateFrameMessageWithNeynar(String frameMessageInHex);
}
