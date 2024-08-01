package ua.sinaver.web3.payflow.message.moxie;

import java.util.List;

public record FanTokenHolder(List<Portfolio> portfolio) {
	public record Portfolio(String balance, User user) {
	}

	public record User(String id) {
	}
}
