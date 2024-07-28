package ua.sinaver.web3.payflow.message;

import java.util.Date;

public record ContactWithFanTokenAuction(ContactMessage contact, FanTokenAuction auction) {
	public record FanTokenAuction(Integer auctionSupply, Date estimatedStartTimestamp,
	                              String launchCastUrl) {
	}
}
