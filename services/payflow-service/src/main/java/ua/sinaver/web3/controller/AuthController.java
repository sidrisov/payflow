package ua.sinaver.web3.controller;

import org.apache.commons.lang3.RandomStringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import ua.sinaver.web3.auth.Web3Authentication;
import ua.sinaver.web3.dto.SiweRawDto;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "${dapp.url}", allowCredentials = "true")
@Transactional
public class AuthController {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthController.class);

    private SecurityContextHolderStrategy securityContextHolderStrategy = SecurityContextHolder
            .getContextHolderStrategy();
    private SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    @Autowired
    private AuthenticationManager authManager;

    @GetMapping("/nonce")
    public String nonce(HttpSession session) {
        String nonce = RandomStringUtils.random(10, true, true);
        session.setAttribute("nonce", nonce);
        return nonce;
    }

    @PostMapping("/verify")
    public ResponseEntity<String> verify(@RequestBody SiweRawDto siwe, HttpServletRequest request,
            HttpServletResponse response, HttpSession session) {
        LOGGER.info("Siwe Raw {}", siwe);

        String sessionNonce = (String) session.getAttribute("nonce");
        LOGGER.debug("sessionNonce {}", sessionNonce);

        if (sessionNonce == null || !siwe.message().nonce().equals(sessionNonce)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        // add check to match nonce previously saved in session and the one included in
        // siwe message

        Authentication authToken = authManager
                .authenticate(new Web3Authentication(siwe.message().address(),
                        siwe.signature()));

        if (authToken.isAuthenticated()) {
            SecurityContext context = this.securityContextHolderStrategy.createEmptyContext();
            context.setAuthentication(authToken);
            // this.securityContextHolderStrategy.setContext(context);
            this.securityContextRepository.saveContext(context, request, response);

            session.removeAttribute("nonce");

            return ResponseEntity.ok().build();
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

    }

    @GetMapping("/logout")
    public void logout() {
    }

}
