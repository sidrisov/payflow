package ua.sinaver.web3.payflow.message.farcaster;

import java.util.List;

public record ComposerActionState(String requestId, Cast cast) {
	public record Cast(Parent parent, String text, List<String> embeds, String castDistribution) {
	}

	public record Parent(String hash) {
	}
}