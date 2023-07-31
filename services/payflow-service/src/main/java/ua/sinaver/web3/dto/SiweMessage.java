package ua.sinaver.web3.dto;

public record SiweMessage(String domain, String address, String statement, String uri, String version, String chainId,
        String nonce, String issuedAt) {
}
