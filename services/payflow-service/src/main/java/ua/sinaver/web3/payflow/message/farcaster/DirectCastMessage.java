package ua.sinaver.web3.payflow.message.farcaster;

import java.util.UUID;

public record DirectCastMessage(Integer recipientFid, String message, UUID idempotencyKey) {
}
