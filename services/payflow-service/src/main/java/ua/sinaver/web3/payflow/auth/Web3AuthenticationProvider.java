package ua.sinaver.web3.payflow.auth;

import com.moonstoneid.siwe.error.SiweException;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;
import ua.sinaver.web3.payflow.message.ConnectedAddresses;
import ua.sinaver.web3.payflow.message.SiweMessage;
import ua.sinaver.web3.payflow.service.api.ISocialGraphService;

@Slf4j
@Component
public class Web3AuthenticationProvider implements AuthenticationProvider {

	@Autowired
	private ISocialGraphService socialGraphService;

	@Override
	public Authentication authenticate(Authentication authentication) throws AuthenticationException {
		if (authentication.getPrincipal() == null) {
			throw new BadCredentialsException("Wrong Credentials");
		}

		log.debug("Auth before verification {}", authentication);

		SiweMessage siweMessage = (SiweMessage) authentication.getDetails();
		try {
			// Verify integrity of SiweMessage by matching its signature
			// Create new SiweMessage
			com.moonstoneid.siwe.SiweMessage siwe = new com.moonstoneid.siwe.SiweMessage.Builder(siweMessage.domain(),
					siweMessage.address(), siweMessage.uri(), siweMessage.version(), siweMessage.chainId(),
					siweMessage.nonce(), siweMessage.issuedAt())
					.requestId(siweMessage.requestId())
					.notBefore(siweMessage.notBefore())
					.expirationTime(siweMessage.expirationTime())
					.statement(siweMessage.statement())
					.resources(siweMessage.resources()).build();
			String signature = (String) authentication.getCredentials();

			// TODO: skip domain and nonce verification for now, read more about domain!
			siwe.verify(siwe.getDomain(), siwe.getNonce(), signature);
			authentication.setAuthenticated(true);
		} catch (SiweException e) {
			log.error("Siwe verification failure", e);
			authentication.setAuthenticated(false);
		}

		// check if it's needed to verify through connected addresses
		if (!StringUtils.equalsIgnoreCase(authentication.getPrincipal().toString(),
				siweMessage.address())) {
			log.debug("Checking if {} in {} verifications", authentication.getPrincipal(),
					siweMessage.address().toLowerCase());
			// find connected addresses for the siwf signer
			ConnectedAddresses connectedAddresses =
					socialGraphService.getIdentityVerifiedAddresses(siweMessage.address());

			if (connectedAddresses == null) {
				log.error("Failed to fetch verifications for {}",
						siweMessage.address());
				authentication.setAuthenticated(false);
				// check if userAddress is the same that signed SIWF (custodial wallet)
			} else if (!StringUtils.equalsIgnoreCase(connectedAddresses.userAddress(),
					siweMessage.address())) {
				log.error("Found user address {} is different from the address which signed siwf {}",
						connectedAddresses.userAddress(), siweMessage.address());
				authentication.setAuthenticated(false);
			} else {
				val identityInConnectedAddresses =
						connectedAddresses.connectedAddresses().contains(authentication.getPrincipal().toString());

				if (!identityInConnectedAddresses) {
					log.debug("Identity {} is not in {} connected addresses",
							authentication.getPrincipal(), siweMessage.address());
					authentication.setAuthenticated(false);
				}
			}
		}

		log.debug("Auth after verification {}", authentication);
		return authentication;
	}

	@Override
	public boolean supports(Class<?> authentication) {
		return authentication.equals(Web3Authentication.class);
	}

}
