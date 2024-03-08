package ua.sinaver.web3.payflow.message;

public record PaymentMessage(String hash, PaymentSource source, String comment) {

	public record PaymentSource(String app, String ref) {
	}
}
