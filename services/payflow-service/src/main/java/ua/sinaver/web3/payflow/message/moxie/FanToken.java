package ua.sinaver.web3.payflow.message.moxie;

import java.math.BigDecimal;

public record FanToken(
		String tokenAddress,
		String name,
		String symbol,
		BigDecimal currentPriceInMoxie,
		BigDecimal currentPriceInWeiInMoxie) {
}
