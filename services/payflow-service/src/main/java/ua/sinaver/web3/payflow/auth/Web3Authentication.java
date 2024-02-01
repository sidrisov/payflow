package ua.sinaver.web3.payflow.auth;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import ua.sinaver.web3.payflow.message.SiweMessage;

public class Web3Authentication extends AbstractAuthenticationToken {

	private final String identity;
	private final SiweMessage siweMessage;
	private final String signature;

	public Web3Authentication(String identity, SiweMessage siweMessage, String signature) {
		super(null);
		this.identity = identity;
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
		return identity;
	}

}
