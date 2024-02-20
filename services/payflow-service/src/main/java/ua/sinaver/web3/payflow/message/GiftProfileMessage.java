package ua.sinaver.web3.payflow.message;

import java.util.List;

public record GiftProfileMessage(ProfileMessage profile, List<GiftMessage> gifts) {

	public record GiftMessage(ProfileMessage gifter, String token) {
	}
}
