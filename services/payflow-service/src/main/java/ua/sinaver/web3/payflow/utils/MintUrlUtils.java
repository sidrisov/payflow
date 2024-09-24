package ua.sinaver.web3.payflow.utils;

import org.apache.commons.lang3.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;

import lombok.val;
import lombok.extern.slf4j.Slf4j;
import ua.sinaver.web3.payflow.message.nft.ParsedMintUrlMessage;

@Slf4j
public class MintUrlUtils {

    public static String calculateProviderMintUrl(String provider, Integer chainId, String contract, Integer tokenId,
            String referral) {
        UriComponentsBuilder builder;

        switch (StringUtils.lowerCase(provider)) {
            case "zora.co":
                builder = UriComponentsBuilder.fromHttpUrl("https://zora.co")
                        .path("/collect/{chainId}:{contract}/{tokenId}")
                        .uriVariables(Map.of(
                                "chainId", chainId,
                                "contract", contract,
                                "tokenId", tokenId != null ? tokenId.toString() : ""));
                break;
            case "rodeo.club":
                builder = UriComponentsBuilder.fromHttpUrl("https://rodeo.club")
                        .path("/post/{contract}/{tokenId}")
                        .uriVariables(Map.of(
                                "contract", contract,
                                "tokenId", tokenId != null ? tokenId.toString() : ""));
                break;
            case "highlight.xyz":
                builder = UriComponentsBuilder.fromHttpUrl("https://highlight.xyz")
                        .path("/mint/{chainId}:{contract}")
                        .uriVariables(Map.of(
                                "chainId", chainId,
                                "contract", contract));
                break;
            default:
                log.warn("Unknown provider: {}. Returning empty string.", provider);
                return "";
        }

        if (StringUtils.isNotBlank(referral)) {
            builder.queryParam("referrer", referral);
        }

        try {
            URI uri = new URI(builder.toUriString());
            return uri.toString();
        } catch (URISyntaxException e) {
            log.error("Error creating provider mint URL", e);
            return "";
        }
    }

    public static String calculateFrameMintUrl(String framesServiceUrl, String provider, Integer chainId,
            String contract, Integer tokenId, String referral) {
        return UriComponentsBuilder.fromHttpUrl(framesServiceUrl)
                .path("/mint")
                .queryParam("provider", provider)
                .queryParam("chainId", chainId)
                .queryParam("contract", contract)
                .queryParam("tokenId", tokenId)
                .queryParam("referral", referral)
                .build()
                .toUriString();
    }

    public static String calculateFrameMintUrlFromToken(String framesServiceUrl, String compositeToken, String chainId,
            String newReferral) {
        val parsedMintParams = ParsedMintUrlMessage.fromCompositeToken(compositeToken, chainId);
        if (parsedMintParams == null) {
            log.error("Failed to parse mint parameters from token: {}", compositeToken);
            return "";
        }

        return calculateFrameMintUrl(
                framesServiceUrl,
                parsedMintParams.provider(),
                Integer.parseInt(parsedMintParams.chain()),
                parsedMintParams.contract(),
                parsedMintParams.tokenId(),
                newReferral);
    }
}
