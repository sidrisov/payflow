package ua.sinaver.web3.payflow.message.nft;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;


@Slf4j
public record ParsedMintUrlMessage(
		String url,
		String provider,
		String chain,
		String contract,
		String tokenId,
		String referrer
) {
	public static final String ZORA_PROVIDER = "zora.co";
	public static final String RODEO_PROVIDER = "rodeo.club";
	public static final String HIGHLIGHTS_PROVIDER = "highlight.xyz";
	public static final List<String> SUPPORTED_MINT_PROVIDERS = List.of(ZORA_PROVIDER, RODEO_PROVIDER);

	// Static method to parse the URL
	public static ParsedMintUrlMessage parse(String url) {
		val uriComponents = UriComponentsBuilder.fromUriString(url).build();

		// Extract provider (host)
		val provider = uriComponents.getHost();

		if (provider == null || !SUPPORTED_MINT_PROVIDERS.contains(provider)) {
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
		String tokenId = null;

		if (provider.equals(HIGHLIGHTS_PROVIDER)) {
			if (pathParts.length >= 3) {
				contract = pathParts[2];
			}
		} else if (pathParts.length >= 4) {
			if ((provider.equals(ZORA_PROVIDER) && !pathParts[1].equals("collect"))
					|| (provider.equals(RODEO_PROVIDER) && !pathParts[1].equals("post"))) {
				return null;
			}

			if (pathParts[2].contains(":")) {
				String[] chainAndContract = pathParts[2].split(":");
				chain = chainAndContract[0];
				contract = chainAndContract[1];
			} else {
				chain = "base";
				contract = pathParts[2];
			}
			tokenId = pathParts[3];
		}

		// Extract optional referrer
		val referrer = uriComponents.getQueryParams().getFirst("referrer");
		return new ParsedMintUrlMessage(url, provider, chain, contract, tokenId, referrer);
	}
}
