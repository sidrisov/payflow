package ua.sinaver.web3.payflow.controller.frames;

import org.springframework.http.ResponseEntity;
import ua.sinaver.web3.payflow.utils.FrameResponse;

public class FramesController {
	public static final ResponseEntity<String> DEFAULT_HTML_RESPONSE =
			FrameResponse.builder().imageUrl("https://i.imgur.com/Vs0loYg.png").build().toHtmlResponse();
	public static final String BASE_PATH = "/api/farcaster/frames";
}
