package ua.sinaver.web3.payflow.message.farcaster;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.util.List;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record Cast(
		String object,
		String hash,
		int fid,
		String threadHash,
		String parentHash,
		String parentUrl,
		String rootParentUrl,
		ParentAuthor parentAuthor,
		FarcasterUser author,
		String text,
		String timestamp,
		List<Embed> embeds,
		List<Frame> frames,
		Reactions reactions,
		Replies replies,
		List<FarcasterUser> mentionedProfiles,
		ViewerContext viewerContext) {

	public record ParentAuthor(Integer fid) {
	}

	public record Embed(String url) {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Frame(
			String version,
			String title,
			String image,
			String imageAspectRatio,
			List<Button> buttons,
			Input input,
			SerializedState state,
			String postUrl,
			String framesUrl) {
	}

	public record Button(
			int index,
			String title,
			String actionType) {
	}

	public record Input() {
	}

	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public record Reactions(
			int likesCount,
			int recastsCount,
			List<Like> likes,
			List<Recast> recasts) {
	}

	public record Like(int fid, String fname) {
	}

	public record Recast(int fid, String fname) {
	}

	public record Replies(int count) {
	}

	public record ViewerContext(boolean following, boolean followedBy) {
	}
}