package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastResponse;

public interface IFarcasterMessagingService {
	DirectCastResponse sendMessage(DirectCastMessage message);

	void sendMessageAsync(DirectCastMessage message);
}
