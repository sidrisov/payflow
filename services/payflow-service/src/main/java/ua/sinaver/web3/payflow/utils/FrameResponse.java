package ua.sinaver.web3.payflow.utils;

import lombok.Builder;
import lombok.Singular;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import ua.sinaver.web3.payflow.message.FrameButton;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Builder
public class FrameResponse {
	public static final FrameButton BACK_FRAME_BUTTON = backFrameButton(null);
	private String imageUrl;
	private String postUrl;
	private String textInput;
	private String state;
	@Builder.Default
	private boolean cacheImage = true;
	@Singular
	private List<FrameButton> buttons;

	private static FrameButton backFrameButton(String target) {
		return new FrameButton("⬅\uFE0F Back",
				FrameButton.ActionType.POST,
				target);
	}

	private static String frameButtonMeta(int index, FrameButton frameButton) {
		var frameButtonMeta = String.format("""
				<meta property="fc:frame:button:%s" content="%s"/>
				""", index, frameButton.name());

		if ((frameButton.action().equals(FrameButton.ActionType.LINK)
				|| frameButton.action().equals(FrameButton.ActionType.POST)
				|| frameButton.action().equals(FrameButton.ActionType.POST_REDIRECT)
				|| frameButton.action().equals(FrameButton.ActionType.TX))
				&& frameButton.target() != null) {
			frameButtonMeta = frameButtonMeta.concat(String.format(
					"""
											<meta property="fc:frame:button:%s:action" content="%s"/>
											<meta property="fc:frame:button:%s:target" content="%s" />
							""", index, frameButton.action().toString().toLowerCase(),
					index, frameButton.target()));
		}
		return frameButtonMeta;
	}

	public ResponseEntity<String> toHtmlResponse() {

		var postMeta = "";
		if (!StringUtils.isBlank(postUrl)) {
			postMeta = String.format("""
					<meta property="fc:frame:post_url" content="%s" />
					""", postUrl);
		}

		var buttonsMeta = "";
		for (int i = 0; i < buttons.size(); i++) {
			buttonsMeta = buttonsMeta.concat(frameButtonMeta(i + 1, buttons.get(i)));
		}

		var inputMeta = "";
		if (!StringUtils.isBlank(textInput)) {
			inputMeta = String.format("""
					<meta property="fc:frame:input:text" content="%s" />
					""", textInput);
		}

		var stateMeta = "";
		if (!StringUtils.isBlank(state)) {
			stateMeta = String.format("""
					<meta property="fc:frame:state" content="%s" />
					""", state);
		}

		val html = String.format("""
				<!DOCTYPE html>
				<html>
				<head>
				<meta property="fc:frame" content="vNext" />
				<meta property="fc:frame:image" content="%s"/>
				%s
				%s
				%s
				%s
				</head>
				</html>
				""", cacheAdjustedImageUrl(), postMeta, stateMeta, buttonsMeta, inputMeta);

		return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(html);
	}

	// if not cached, add timestamp
	private String cacheAdjustedImageUrl() {
		val currentTime = Instant.now();
		val adjustedTimestamp = (cacheImage ? currentTime.truncatedTo(ChronoUnit.HOURS) :
				currentTime).toEpochMilli();

		if (!StringUtils.isBlank(imageUrl)) {
			return imageUrl.concat(
					String.format("%stimestamp=%s",
							imageUrl.contains("?") ? "&" : "?",
							adjustedTimestamp));
		} else {
			return "";
		}
	}

	public record FrameMessage(String message) {
	}

	public record ActionFrame(String type, String frameUrl) {
	}

	public record ComposerActionForm(String type, String title, String url) {
	}
}
