package ua.sinaver.web3.dto;

public record WalletDto(String address, String network, boolean smart, String master) {
}
