package ua.sinaver.web3.payflow.message;

public record PaymentUpdateMessage(String hash, String fulfillmentId, Integer fulfillmentChainId,
                                   String fulfillmentHash) {
}
