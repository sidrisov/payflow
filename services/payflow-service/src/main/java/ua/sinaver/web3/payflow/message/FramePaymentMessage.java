package ua.sinaver.web3.payflow.message;

public record FramePaymentMessage(String address, int chainId, String token, Double usdAmount,
                                  String refId) {
}
