package ua.sinaver.web3.payflow.message.protocol;

public record CreatePaymentResponse(String paymentId, String paymentUrl, String frameUrl) {
}
