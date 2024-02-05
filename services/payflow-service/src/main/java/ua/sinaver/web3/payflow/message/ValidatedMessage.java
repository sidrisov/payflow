package ua.sinaver.web3.payflow.message;

enum MessageType {
	MESSAGE_TYPE_FRAME_ACTION,
}

enum HashScheme {
	HASH_SCHEME_BLAKE3,
}

enum SignatureScheme {
	SIGNATURE_SCHEME_ED25519,
}

enum Network {
	FARCASTER_NETWORK_MAINNET,
}

public record ValidatedMessage(
		boolean valid,
		Message message
) {
	public record Message(
			MessageData data,
			String hash,
			HashScheme hashScheme,
			String signature,
			SignatureScheme signatureScheme,
			String signer
	) {
	}

	public record MessageData(
			MessageType type,
			long fid,
			long timestamp,
			Network network,
			FrameActionBody frameActionBody
	) {
	}

	public record FrameActionBody(
			String url,
			int buttonIndex,
			String inputText,
			CastId castId
	) {
	}

	public record CastId(long fid, String hash) {
	}
}

