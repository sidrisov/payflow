package ua.sinaver.web3.payflow.message.farcaster.modbot;

import java.util.List;

public record MembershipRequestMessage(User user, Channel channel) {
	public record User(Integer fid, String username, List<String> verifications) {
	}

	public record Channel(String id) {
	}
}
