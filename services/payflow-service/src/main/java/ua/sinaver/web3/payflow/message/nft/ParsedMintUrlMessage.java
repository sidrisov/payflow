package ua.sinaver.web3.payflow.message.nft;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.util.List;

@Slf4j
public record ParsedMintUrlMessage(
		String provider,
		String chain,
		String contract,
		Integer tokenId,
		String referral,
		String author,
		String url) {

	public static final String ZORA_PROVIDER = "zora.co";
	public static final String RODEO_PROVIDER = "rodeo.club";
	public static final String HIGHLIGHTS_PROVIDER = "highlight.xyz";
	public static final List<String> SUPPORTED_MINT_PROVIDERS = List.of(ZORA_PROVIDER, RODEO_PROVIDER,
			HIGHLIGHTS_PROVIDER);

	private static final WebClient webClient = WebClient.builder()
			.clientConnector(new ReactorClientHttpConnector(HttpClient.create().followRedirect(false)))
			.build();

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
			case ZORA_PROVIDER -> parseZora(uriComponents, url);
			case RODEO_PROVIDER -> parseRodeo(uriComponents, url);
			case HIGHLIGHTS_PROVIDER -> parseHighlight(uriComponents, url);
			default -> null;
		};

		if (result != null) {
			// Extract optional referral
			val referral = uriComponents.getQueryParams().getFirst("referrer");
			return new ParsedMintUrlMessage(result.provider(), result.chain(), result.contract(), result.tokenId(),
					referral, result.author(), url);
		}
		return null;
	}

	private static ParsedMintUrlMessage parseZora(UriComponents uriComponents, String url) {
		val pathParts = uriComponents.getPath().split("/");
		if (pathParts.length < 4 || !pathParts[1].equals("collect")) {
			return null;
		}

		String chain;
		String contract;
		if (pathParts[2].contains(":")) {
			val chainAndContract = pathParts[2].split(":");
			chain = chainAndContract[0].replace("oeth", "optimism");
			contract = chainAndContract[1];
		} else {
			chain = "base";
			contract = pathParts[2];
		}
		val tokenId = Integer.parseInt(pathParts[3]);
		return new ParsedMintUrlMessage(ZORA_PROVIDER, chain, contract, tokenId, null, null, url);
	}

	private static ParsedMintUrlMessage parseRodeo(UriComponents uriComponents, String url) {
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
		return new ParsedMintUrlMessage(RODEO_PROVIDER, chain, contract, tokenId, null, null, url);
	}

	private static ParsedMintUrlMessage parseHighlight(UriComponents uriComponents, String url) {
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
			log.debug("Redirected from {} to: {}", uriComponents.toUriString(), redirectLocation);
			if (redirectLocation == null) {
				return null;
			}
			val redirectComponents = UriComponentsBuilder.fromUriString(redirectLocation).build();
			return parseHighlight(redirectComponents, url);
		}

		return new ParsedMintUrlMessage(HIGHLIGHTS_PROVIDER, chain, contract, null, null, null, url);
	}

	public static String getRedirectLocation(String url) {
		try {
			return webClient.get()
					.uri(url)
					.exchangeToMono(response -> {
						if (response.statusCode().is3xxRedirection()) {
							String location = response.headers().header("Location").getFirst();
							log.debug("Redirect location: {}", location);
							return Mono.just(location);
						} else {
							log.debug("No redirection");
							return Mono.empty();
						}
					})
					.block();
		} catch (Exception e) {
			log.error("Error getting redirect location for URL: {}", url, e);
			return null;
		}
	}

	public static ParsedMintUrlMessage fromCompositeToken(String compositeToken, String chainId, String url) {
		val parts = compositeToken.split(":");
		if (parts.length < 4) {
			log.error("Invalid composite token format: {}", compositeToken);
			return null;
		}
		String author = null;

		val provider = parts[0];
		val contract = parts[1];
		val tokenId = !parts[2].isEmpty() ? Integer.parseInt(parts[2]) : null;
		val referral = parts[3];
		if (parts.length == 5) {
			author = parts[4];
		}

		return new ParsedMintUrlMessage(provider, String.valueOf(chainId), contract, tokenId, referral, author, url);
	}
}
