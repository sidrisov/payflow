package ua.sinaver.web3.auth;

import org.springframework.security.authentication.AbstractAuthenticationToken;

import ua.sinaver.web3.message.SiweMessage;

public class Web3Authentication extends AbstractAuthenticationToken {

    private SiweMessage siweMessage;
    private String signature;

    public Web3Authentication(SiweMessage siweMessage, String signature) {
        super(null);
        this.siweMessage = siweMessage;
        this.signature = signature;
    }

    @Override
    public Object getDetails() {
        return siweMessage;
    }

    @Override
    public Object getCredentials() {
        return signature;
    }

    @Override
    public Object getPrincipal() {
        return siweMessage.address();
    }

}
