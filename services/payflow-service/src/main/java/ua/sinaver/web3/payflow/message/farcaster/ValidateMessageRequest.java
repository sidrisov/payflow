package ua.sinaver.web3.payflow.message.farcaster;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ValidateMessageRequest(
		boolean castReactionContext,
		boolean followContext,
		boolean signerContext,
		boolean includeChannelContext,
		String messageBytesInHex
) {
}