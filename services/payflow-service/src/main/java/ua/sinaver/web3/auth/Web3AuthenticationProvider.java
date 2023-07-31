package ua.sinaver.web3.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

@Component
public class Web3AuthenticationProvider implements AuthenticationProvider {
    private static final Logger LOGGER = LoggerFactory.getLogger(Web3AuthenticationProvider.class);

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        if (authentication.getPrincipal() == null) {
            throw new BadCredentialsException("Wrong Credentials");
        }
        LOGGER.info("auth before {}", authentication);
        Web3Authentication authenticated = new Web3Authentication(authentication.getPrincipal().toString(),
                authentication.getCredentials().toString());
        authenticated.setAuthenticated(true);

        LOGGER.info("auth before {}", authenticated);

        return authenticated;
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return authentication.equals(Web3Authentication.class);
    }

}
