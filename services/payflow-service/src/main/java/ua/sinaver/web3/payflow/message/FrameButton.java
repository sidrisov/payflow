package ua.sinaver.web3.payflow.message;

public record FrameButton(String name, ActionType action,
                          String target) {

	public enum ActionType {
		POST,
		POST_REDIRECT,
		MINT,
		TX,
		LINK
	}
}
