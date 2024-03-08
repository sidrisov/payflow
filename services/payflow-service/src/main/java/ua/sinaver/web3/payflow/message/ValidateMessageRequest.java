package ua.sinaver.web3.payflow.message;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ValidateMessageRequest(
		@JsonProperty("cast_reaction_context") boolean castReactionContext,
		@JsonProperty("follow_context") boolean followContext,
		@JsonProperty("signer_context") boolean signerContext,
		@JsonProperty("message_bytes_in_hex") String messageBytesInHex

) {
}