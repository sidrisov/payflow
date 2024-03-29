package ua.sinaver.web3.payflow.message;

public record ValidatedXmtpFrameMessage(
		ActionBody actionBody,
		String verifiedWalletAddress
) {
	public record ActionBody(
			String frameUrl,
			int buttonIndex,
			Timestamp timestamp,
			String opaqueConversationIdentifier,
			long unixTimestamp,
			String inputText,
			String state
	) {
		public record Timestamp(
				int low,
				int high,
				boolean unsigned
		) {
		}
	}
}