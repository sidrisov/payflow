package ua.sinaver.web3.message;

public record PaymentRequestMessage(
                String account, String flowUuid, String title,
                String description, String uuid,
                String network,
                String address,
                String amount,
                boolean payed,
                String proof) {
}
