package ua.sinaver.web3.payflow.message.farcaster;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ValidatedFrameResponseMessage(
		boolean valid,
		Action action,
		SignatureTemporaryObject signatureTemporaryObject
) {
	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Action(
			String object,
			String url,
			FarcasterUser interactor,
			TappedButton tappedButton,
			Input input,
			SerializedState state,
			Cast cast,
			String timestamp,
			Transaction transaction,
			String address,
			Signer signer) {
	}

	public record Signer(FarcasterUser client) {
	}

	public record TappedButton(int index) {
	}

	public record Input(String text) {
	}

	public record Transaction(
			String hash
	) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record SignatureTemporaryObject(
			String note,
			String hash,
			String hashScheme,
			String signature,
			String signatureScheme,
			String signer) {
	}
}
