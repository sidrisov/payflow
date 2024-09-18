package ua.sinaver.web3.payflow.message.nft;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.HttpURLConnection;
import java.net.URI;
import java.util.List;

@Slf4j
public record ParsedMintUrlMessage(
		String provider,
		String chain,
		String contract,
		Integer tokenId,
		String referral,
		String author) {

	public static final String ZORA_PROVIDER = "zora.co";
	public static final String RODEO_PROVIDER = "rodeo.club";
	public static final String HIGHLIGHTS_PROVIDER = "highlight.xyz";
	public static final List<String> SUPPORTED_MINT_PROVIDERS = List.of(ZORA_PROVIDER, RODEO_PROVIDER,
			HIGHLIGHTS_PROVIDER);

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

		ParsedMintUrlMessage result = switch (provider) {
			case ZORA_PROVIDER -> parseZora(uriComponents);
			case RODEO_PROVIDER -> parseRodeo(uriComponents);
			case HIGHLIGHTS_PROVIDER -> parseHighlight(uriComponents);
			default -> null;
		};

		if (result != null) {
			// Extract optional referral
			val referral = uriComponents.getQueryParams().getFirst("referrer");
			return new ParsedMintUrlMessage(result.provider(), result.chain(), result.contract(), result.tokenId(),
					referral, result.author());
		}
		return null;
	}

	private static ParsedMintUrlMessage parseZora(UriComponents uriComponents) {
		val pathParts = uriComponents.getPath().split("/");
		if (pathParts.length < 4 || !pathParts[1].equals("collect")) {
			return null;
		}

		String chain;
		String contract;
		if (pathParts[2].contains(":")) {
			val chainAndContract = pathParts[2].split(":");
			chain = chainAndContract[0];
			contract = chainAndContract[1];
		} else {
			chain = "base";
			contract = pathParts[2];
		}
		val tokenId = Integer.parseInt(pathParts[3]);
		return new ParsedMintUrlMessage(ZORA_PROVIDER, chain, contract, tokenId, null, null);
	}

	private static ParsedMintUrlMessage parseRodeo(UriComponents uriComponents) {
		val pathParts = uriComponents.getPath().split("/");
		if (pathParts.length < 4 || !pathParts[1].equals("post")) {
			return null;
		}

		String chain;
		String contract;
		if (pathParts[2].contains(":")) {
			val chainAndContract = pathParts[2].split(":");
			chain = chainAndContract[0];
			contract = chainAndContract[1];
		} else {
			chain = "base";
			contract = pathParts[2];
		}
		val tokenId = Integer.parseInt(pathParts[3]);
		return new ParsedMintUrlMessage(RODEO_PROVIDER, chain, contract, tokenId, null, null);
	}

	private static ParsedMintUrlMessage parseHighlight(UriComponents uriComponents) {
		val pathParts = uriComponents.getPath().split("/");
		if (pathParts.length < 3 || !pathParts[1].equals("mint")) {
			return null;
		}

		String chain;
		String contract;

		if (pathParts[2].contains(":")) {
			val chainAndContract = pathParts[2].split(":");
			chain = chainAndContract[0];
			contract = chainAndContract[1];
		} else {
			val redirectLocation = getRedirectLocation(uriComponents.toUriString());
			if (redirectLocation == null) {
				return null;
			}
			UriComponents redirectComponents = UriComponentsBuilder.fromUriString(redirectLocation).build();
			return parseHighlight(redirectComponents);
		}

		return new ParsedMintUrlMessage(HIGHLIGHTS_PROVIDER, chain, contract, null, null, null);
	}

	private static String getRedirectLocation(String url) {
		try {
			val connection = (HttpURLConnection) URI.create(url).toURL().openConnection();
			connection.setRequestMethod("HEAD");
			connection.setInstanceFollowRedirects(false);
			return connection.getHeaderField("Location");
		} catch (Exception e) {
			log.error("Error getting redirect location for URL: {}", url, e);
			return null;
		}
	}

	public static ParsedMintUrlMessage fromCompositeToken(String compositeToken, String chainId) {
		val parts = compositeToken.split(":");
		if (parts.length < 4) {
			log.error("Invalid composite token format: {}", compositeToken);
			return null;
		}
		String author = null;

		val provider = parts[0];
		val contract = parts[1];
		val tokenId = Integer.parseInt(parts[2]);
		val referral = parts[3];
		if (parts.length == 5) {
			author = parts[4];
		}

		return new ParsedMintUrlMessage(provider, String.valueOf(chainId), contract, tokenId, referral, author);
	}
}
