package ua.sinaver.web3.payflow.service;

import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class PaymentService {
	@Autowired
	private TokenService tokenService;

	public String parseCommandToken(String text) {
		val patternStr = String.format("\\b(?<token>%s)\\b",
				tokenService.getTokens().stream()
						.map(t -> Pattern.quote(t.id().toLowerCase()))
						.distinct()
						.collect(Collectors.joining("|")));
		val pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE);
		val matcher = pattern.matcher(text);
		return matcher.find() ? matcher.group("token").toLowerCase() : "usdc";
	}

	public String parseCommandChain(String text) {
		val patternStr = String.format("\\b(?<chain>%s)\\b",
				tokenService.getTokens().stream()
						.map(t -> {
							val chain = t.chain();
							return Pattern.quote(chain.equals(TokenService.DEGEN_CHAIN_NAME) ? "degen-l3" : chain);
						}).distinct()
						.collect(Collectors.joining("|")));

		val pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE);
		val matcher = pattern.matcher(text);
		if (matcher.find()) {
			var matched = matcher.group("chain").toLowerCase();
			if (matched.equals("degen-l3")) {
				matched = TokenService.DEGEN_CHAIN_NAME;
			}
			return matched.toLowerCase();
		}
		return TokenService.BASE_CHAIN_NAME;
	}
}
