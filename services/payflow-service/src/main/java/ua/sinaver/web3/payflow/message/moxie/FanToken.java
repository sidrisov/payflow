package ua.sinaver.web3.payflow.message.moxie;

import java.math.BigDecimal;

public record FanToken(
		String tokenAddress,
		String tokenSubjectAddress,
		String name,
		String symbol,
		BigDecimal currentPriceInMoxie,
		BigDecimal currentPriceInWeiInMoxie,
		Subject subject) {
	public record Subject(String subjectAddress) {
	}
}
