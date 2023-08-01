package ua.sinaver.web3.controller;

import org.apache.commons.lang3.RandomStringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.SiweChallengeMessage;
import ua.sinaver.web3.service.IUserService;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "${dapp.url}", allowCredentials = "true")
@Transactional
public class AuthController {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authManager;

    @Autowired
    private IUserService userService;

    @GetMapping("/nonce")
    public String nonce(HttpSession session) {
        String nonce = RandomStringUtils.random(10, true, true);
        session.setAttribute("nonce", nonce);
        return nonce;
    }

    @PostMapping("/verify")
    public ResponseEntity<String> verify(@RequestBody SiweChallengeMessage siwe, HttpServletRequest request,
            HttpServletResponse response, HttpSession session) {
        LOGGER.debug("Siwe Challenge Request: {}", siwe);

        String sessionNonce = (String) session.getAttribute("nonce");
        LOGGER.debug("nonce from session {}", sessionNonce);

        // check if nonce match with previosly generated for this session
        if (sessionNonce == null || !siwe.message().nonce().equals(sessionNonce)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        Authentication authentication = authManager.authenticate(
                new Web3Authentication(siwe.message(), siwe.signature()));

        if (authentication.isAuthenticated()) {
            // save authentication to security context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // remove nonce, so it can't be re-used
            session.removeAttribute("nonce");

            // create a user if not exist
            String signer = authentication.getPrincipal().toString();
            User user = userService.findUser(signer);
            if (user == null) {
                userService.saveUser(signer, signer);
            }

            return ResponseEntity.ok().build();
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

    }

    @GetMapping("/logout")
    public void logout() {
    }
}
