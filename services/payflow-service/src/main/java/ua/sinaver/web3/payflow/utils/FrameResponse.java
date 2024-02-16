package ua.sinaver.web3.payflow.utils;

import lombok.Builder;
import lombok.Singular;
import org.apache.commons.lang3.StringUtils;
import ua.sinaver.web3.payflow.message.FrameButton;

import java.util.List;

@Builder
public class FrameResponse {

	private String image;
	private String postUrl;
	private String input;

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

	public String toHtml() {
		var buttonsMeta = "";
		for (int i = 0; i < buttons.size(); i++) {
			buttonsMeta = buttonsMeta.concat(frameButtonMeta(i + 1, buttons.get(i)));
		}

		var inputMeta = "";
		if (!StringUtils.isBlank(input)) {
			inputMeta = String.format("""
					<meta property="fc:frame:input:text" content="%s" />
					""", input);
		}

		return String.format("""
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
				""", image, postUrl, buttonsMeta, inputMeta);
	}
}
