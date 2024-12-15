package ua.sinaver.web3.payflow.message.protocol;

import java.util.List;

public record CreatePaymentRequest(
    String type,
    String name,
    Source source,
    List<Recipient> recipients,
    Payment payment
) {
    public record Source(
        String type,
        String link
    ) {}

    public record Recipient(
        Social social,
        String address,
        String comment
    ) {
        public record Social(
            String type,
            String identifier
        ) {}
    }

    public record Payment(
        String amount,
        String token,
        Integer chain
    ) {}
}
