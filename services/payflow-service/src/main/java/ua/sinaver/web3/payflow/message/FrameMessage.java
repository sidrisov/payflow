package ua.sinaver.web3.payflow.message;

public record FrameMessage(UntrustedData untrustedData, TrustedData trustedData) {
	public record UntrustedData(long fid, String url, String messageHash, long timestamp,
	                            int network, int buttonIndex, String inputText,
	                            CastId castId) {
	}

	public record TrustedData(String messageBytes) {
	}

	public record CastId(long fid, String hash) {
	}
}





