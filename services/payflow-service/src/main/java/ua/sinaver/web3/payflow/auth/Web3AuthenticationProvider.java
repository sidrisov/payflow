package ua.sinaver.web3.payflow.auth;

import com.moonstoneid.siwe.error.SiweException;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.Strings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;
import ua.sinaver.web3.payflow.message.SiweMessage;
import ua.sinaver.web3.payflow.service.FarcasterNeynarService;

@Slf4j
@Component
public class Web3AuthenticationProvider implements AuthenticationProvider {
	@Autowired
	private FarcasterNeynarService neynarService;

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

			siwe.verify(siwe.getDomain(), siwe.getNonce(), signature);
			authentication.setAuthenticated(true);
		} catch (SiweException e) {
			log.error("Siwe verification failure", e);
			authentication.setAuthenticated(false);
		}

		// check if it's needed to verify through connected addresses
		if (!Strings.CI.equals(authentication.getPrincipal().toString(),
				siweMessage.address())) {
			log.debug("Checking if {} in {} verifications", authentication.getPrincipal(),
					siweMessage.address().toLowerCase());
			// find connected addresses for the siwf signer
			val farcasterUser = neynarService.fetchFarcasterUser(siweMessage.address());

			if (farcasterUser == null) {
				log.error("Failed to fetch farcaster verifications for {}",
						siweMessage.address());
				authentication.setAuthenticated(false);
				// check if userAddress is the same that signed SIWF (custodial wallet)
			} else {
				// verify that the signer is either the custody address or one of the auth
				// addresses
				boolean isCustody = Strings.CI.equals(farcasterUser.custodyAddress(), siweMessage.address());
				boolean isAuthAddress = farcasterUser.authAddresses() != null && farcasterUser.authAddresses().stream()
						.anyMatch(a -> Strings.CI.equals(a.address(), siweMessage.address()));

				if (!isCustody && !isAuthAddress) {
					log.error("Signer address {} is not associated with farcaster user {}",
							siweMessage.address(), farcasterUser.fid());
					authentication.setAuthenticated(false);
				} else {
					// verify that the principal is in the verified addresses list
					boolean principalIsVerified = farcasterUser.verifications() != null
							&& farcasterUser.verifications().stream()
									.anyMatch(v -> Strings.CI.equals(v, authentication.getPrincipal().toString()));

					if (!principalIsVerified) {
						log.debug("Identity {} is not in {} verified addresses",
								authentication.getPrincipal(), siweMessage.address());
						authentication.setAuthenticated(false);
					}
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
