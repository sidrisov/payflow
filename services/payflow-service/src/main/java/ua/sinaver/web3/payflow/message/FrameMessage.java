package ua.sinaver.web3.payflow.message;

import java.util.List;

public record FrameMessage(String clientProtocol, UntrustedData untrustedData,
                           TrustedData trustedData) {
	public record UntrustedData(long fid, String url, String messageHash, long timestamp,
	                            int network, int buttonIndex, String inputText, String state,
	                            CastId castId, String transactionId, String walletAddress,
	                            String opaqueConversationIdentifier,
	                            List<String> participantAccountAddresses) {
	}

	public record TrustedData(String messageBytes) {
	}

	public record CastId(long fid, String hash) {
	}
}





