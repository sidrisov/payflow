package ua.sinaver.web3.payflow.message;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record CastMessage(
		String hash,
		@JsonProperty("thread_hash") String threadHash,
		@JsonProperty("parent_hash") String parentHash,
		@JsonProperty("parent_url") String parentUrl,
		@JsonProperty("root_parent_url") String rootParentUrl,
		@JsonProperty("parent_author") ParentProfile parentAuthor,
		Profile author,
		String text,
		List<CastEmbed> embeds,
		String timestamp,
		@JsonProperty("mentioned_profiles") List<Profile> mentionedProfiles
) {
	public record Profile(
			Integer fid,
			@JsonProperty("custody_address") String custodyAddress,
			String username,
			@JsonProperty("display_name") String displayName,
			@JsonProperty("pfp_url") String pfpUrl,
			List<String> verifications
	) {
	}

	public record ParentProfile(
			Integer fid
	) {
	}
}