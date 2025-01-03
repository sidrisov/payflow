package ua.sinaver.web3.payflow.message;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import ua.sinaver.web3.payflow.data.WalletSession;

import java.time.Instant;

@Data
public class WalletSessionMessage {
    private String sessionId;
    private boolean active;
    private Instant createdAt;
    private Instant expiresAt;
    private String sessionKey;
    private JsonNode actions;

    public static WalletSessionMessage convert(WalletSession session) {
        if (session == null)
            return null;

        WalletSessionMessage message = new WalletSessionMessage();
        message.setSessionId(session.getSessionId());
        message.setActive(session.getActive());
        message.setCreatedAt(session.getCreatedAt());
        message.setExpiresAt(session.getExpiresAt());
        message.setActions(session.getActions());
        return message;
    }

    public static WalletSession convert(WalletSessionMessage message) {
        if (message == null)
            return null;

        WalletSession session = new WalletSession();
        session.setSessionId(message.getSessionId());
        session.setActive(message.isActive());
        if (message.getCreatedAt() != null) {
            session.setCreatedAt(message.getCreatedAt());
        }
        if (message.getExpiresAt() != null) {
            session.setExpiresAt(message.getExpiresAt());
        }
        session.setSessionKey(message.getSessionKey());
        session.setActions(message.getActions());
        return session;
    }
}
