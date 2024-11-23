package ua.sinaver.web3.payflow.message.farcaster;


public record DirectCastResponse(Result result) {
	public record Result(String conversationId, String messageId) {
	}
}
