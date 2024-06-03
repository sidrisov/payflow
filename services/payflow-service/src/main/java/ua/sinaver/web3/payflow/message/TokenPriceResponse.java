package ua.sinaver.web3.payflow.message;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

public record TokenPriceResponse(Data data) {
	public record Data(String id, String type, Attributes attributes) {
	}

	public record Attributes(@JsonProperty("token_prices") Map<String, String> tokenPrices) {
	}
}