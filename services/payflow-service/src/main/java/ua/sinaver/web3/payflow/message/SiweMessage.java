package ua.sinaver.web3.payflow.message;

import java.io.Serializable;

public record SiweMessage(String domain, String address, String statement, String uri,
                          String version, int chainId,
                          String nonce, String issuedAt, String expirationTime, String notBefore,
                          String requestId, String[] resources)
		implements Serializable {
}
