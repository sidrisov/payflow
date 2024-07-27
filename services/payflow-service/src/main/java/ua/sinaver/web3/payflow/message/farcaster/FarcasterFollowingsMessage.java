package ua.sinaver.web3.payflow.message.farcaster;

import java.util.List;

public record FarcasterFollowingsMessage(List<FarcasterFollowing> users) {
	public record FarcasterFollowing(FarcasterUser user) {
	}
}




