package ua.sinaver.web3.payflow.message.nft;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;


@Slf4j
public record ParsedMintUrlMessage(
		String provider,
		String chain,
		String contract,
		String token,
		String referrer
) {
	public static final List<String> SUPPORTED_MINT_PROVIDERS = List.of("zora.co", "rodeo.club");

	// Static method to parse the URL
	public static ParsedMintUrlMessage parse(String url) {
		val uriComponents = UriComponentsBuilder.fromUriString(url).build();

		// Extract provider (host)
		val provider = uriComponents.getHost();

		if (!SUPPORTED_MINT_PROVIDERS.contains(provider)) {
			log.error("Not supported mint url: {}", url);
			return null;
		}

		// Extract path parts
		if (uriComponents.getPath() == null) {
			return null;
		}

		val pathParts = uriComponents.getPath().split("/");
		String chain = null;
		String contract = null;
		String token = null;

		if (pathParts.length >= 4) {
			if (pathParts[2].contains(":")) {
				String[] chainAndContract = pathParts[2].split(":");
				chain = chainAndContract[0];
				contract = chainAndContract[1];
			} else {
				contract = pathParts[2];
			}
			token = pathParts[3];
		}

		// Extract optional referrer
		val referrer = uriComponents.getQueryParams().getFirst("referrer");
		return new ParsedMintUrlMessage(provider, chain, contract, token, referrer);
	}
}
