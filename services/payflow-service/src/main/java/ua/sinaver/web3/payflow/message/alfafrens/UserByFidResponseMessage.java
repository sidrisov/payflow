package ua.sinaver.web3.payflow.message.alfafrens;


import com.fasterxml.jackson.annotation.JsonProperty;

public record UserByFidResponseMessage(Result result) {
	public record Result(Data data) {
		public record Data(@JsonProperty("aa_address") String aaAddress, String fid,
		                   Channels channels) {
			public record Channels(@JsonProperty("channeladdress") String channelAddress) {
			}
		}
	}
}

