package ua.sinaver.web3.payflow.message;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record ValidatedFrameMessage(
		boolean valid,
		Action action,
		@JsonProperty("signature_temporary_object") SignatureTemporaryObject signatureTemporaryObject
) {
	public record Action(
			String object,
			Interactor interactor,
			@JsonProperty("tapped_button") TappedButton tappedButton,
			Input input,
			String url,
			State state,
			Cast cast,
			Transaction transaction
	) {
	}

	public record Interactor(
			String object,
			int fid,
			@JsonProperty("custody_address") String custodyAddress,
			String username,
			@JsonProperty("display_name") String displayName,
			@JsonProperty("pfp_url") String pfpUrl,
			Profile profile,
			@JsonProperty("follower_count") int followerCount,
			@JsonProperty("following_count") int followingCount,
			List<String> verifications,
			@JsonProperty("active_status") String activeStatus
	) {
	}

	public record State(
			String serialized
	) {
	}

	public record Profile(Bio bio) {
	}

	public record Bio(String text) {
	}

	public record TappedButton(int index) {
	}

	public record Input(String text) {
	}

	public record Cast(
			String object,
			String hash,
			int fid
	) {
	}

	public record Transaction(
			String hash
	) {
	}

	public record SignatureTemporaryObject(
			String note,
			String hash,
			@JsonProperty("hash_scheme") String hashScheme,
			String signature,
			@JsonProperty("signature_scheme") String signatureScheme,
			String signer
	) {
	}
}
