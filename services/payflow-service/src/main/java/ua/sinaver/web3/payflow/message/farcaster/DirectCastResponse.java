package ua.sinaver.web3.payflow.message.farcaster;


public record DirectCastResponse(Result result) {
	public record Result(boolean success) {
	}
}
