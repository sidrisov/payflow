package ua.sinaver.web3.payflow.auth;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import ua.sinaver.web3.payflow.data.protocol.ClientApiKey;

import java.util.Collections;

public class ClientApiKeyAuthentication extends AbstractAuthenticationToken {
	private final ClientApiKey clientApiKey;

	public ClientApiKeyAuthentication(ClientApiKey clientApiKey) {
		super(Collections.emptyList());
		this.clientApiKey = clientApiKey;
		setAuthenticated(true);
	}

	@Override
	public Object getCredentials() {
		return clientApiKey.getApiKey();
	}

	@Override
	public Object getPrincipal() {
		return clientApiKey;
	}
}
