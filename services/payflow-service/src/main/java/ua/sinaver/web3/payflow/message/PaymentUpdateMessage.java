package ua.sinaver.web3.payflow.message;

public record PaymentUpdateMessage(Integer chainId, String token, String hash, String fulfillmentId,
                                   Integer fulfillmentChainId,
                                   String fulfillmentHash,
                                   Double tokenAmount,
                                   String comment) {
}
