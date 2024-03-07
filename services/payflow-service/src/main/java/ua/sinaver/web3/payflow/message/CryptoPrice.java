package ua.sinaver.web3.payflow.message;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CryptoPrice(@JsonProperty("usd") double usd) {
}
