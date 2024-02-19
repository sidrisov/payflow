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
	private String imageUrl;
	private String postUrl;
	private String textInput;
	@Builder.Default
	private boolean cacheImage = true;

	@Singular
	private List<FrameButton> buttons;

	private static String frameButtonMeta(int index, FrameButton frameButton) {
		var frameButtonMeta = String.format("""
				<meta property="fc:frame:button:%s" content="%s"/>
				""", index, frameButton.name());

		if (frameButton.action().equals(FrameButton.ActionType.LINK)) {
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

		val html = String.format("""
				<!DOCTYPE html>
				<html>
				<head>
				<meta property="fc:frame" content="vNext" />
				<meta property="fc:frame:image" content="%s"/>
				<meta property="fc:frame:post_url" content="%s" />
				%s
				%s
				</head>
				</html>
				""", cacheAdjustedImageUrl(), postUrl, buttonsMeta, inputMeta);

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
}
