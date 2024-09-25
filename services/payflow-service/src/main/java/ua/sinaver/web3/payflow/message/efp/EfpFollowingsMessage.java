package ua.sinaver.web3.payflow.message.efp;

import java.util.List;

public record EfpFollowingsMessage(List<EftFollowing> following) {

	public record EftFollowing(String address) {
	}
}
