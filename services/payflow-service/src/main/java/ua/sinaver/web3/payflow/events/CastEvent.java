package ua.sinaver.web3.payflow.events;

import java.util.List;

import ua.sinaver.web3.payflow.message.farcaster.Cast;

public record CastEvent(
		String message,
		String castHash,
		List<Cast.Embed> embeds) {
}
