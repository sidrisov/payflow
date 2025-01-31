package ua.sinaver.web3.payflow.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;

public record WalletSessionMessage(
	String sessionId,
	boolean active,
	Instant createdAt,
	Instant expiresAt,
	String sessionKey,
	JsonNode actions
) {
}
