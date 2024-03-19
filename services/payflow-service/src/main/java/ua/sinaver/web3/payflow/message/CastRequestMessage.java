package ua.sinaver.web3.payflow.message;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record CastRequestMessage(@JsonProperty("signer_uuid") String signerUuid, String text,
                                 String parent,
                                 List<CastEmbed> embeds) {
}
