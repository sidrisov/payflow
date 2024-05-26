package ua.sinaver.web3.payflow.message.alfafrens;


import com.fasterxml.jackson.annotation.JsonProperty;

public record UserByFidResponseMessage(
		String userAddress,
		String fid,
		String handle,
		@JsonProperty("channeladdress") String channelAddress
) {
}

