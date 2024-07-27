package ua.sinaver.web3.payflow.message.farcaster;

public record ComposerCastActionMeta(
		String type,
		String name,
		String icon,
		String description,
		String aboutUrl,
		String imageUrl,
		Action action
) {
	public record Action(String type) {
	}
}