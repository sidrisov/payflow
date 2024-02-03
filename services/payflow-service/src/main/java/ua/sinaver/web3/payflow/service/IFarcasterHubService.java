package ua.sinaver.web3.payflow.service;

import ua.sinaver.web3.payflow.message.ValidatedMessage;

public interface IFarcasterHubService {
	ValidatedMessage validateFrameMessage(String frameMessageInHex);
}
