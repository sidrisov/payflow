package ua.sinaver.web3.auth;

import org.springframework.security.authentication.AbstractAuthenticationToken;

public class Web3Authentication extends AbstractAuthenticationToken {


    private String address;
    private String signature;

    public Web3Authentication(String address, String signature) {
        super(null);
        this.address = address;
        this.signature = signature;
    }

    @Override
    public Object getCredentials() {
        return signature;
    }

    @Override
    public Object getPrincipal() {
        return address;
    }

}
