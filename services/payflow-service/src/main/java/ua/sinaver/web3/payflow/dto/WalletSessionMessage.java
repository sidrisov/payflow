package ua.sinaver.web3.payflow.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import org.mapstruct.AfterMapping;
import org.mapstruct.MappingTarget;

import java.time.Instant;

@Data
public class WalletSessionMessage {
	private String sessionId;
	private boolean active;
	private Instant createdAt;
	private Instant expiresAt;
	private String sessionKey;
	private JsonNode actions;
}
