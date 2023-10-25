package ua.sinaver.web3.controller;

import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
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
import lombok.val;
import lombok.extern.slf4j.Slf4j;
import ua.sinaver.web3.auth.Web3Authentication;
import ua.sinaver.web3.message.SiweChallengeMessage;
import ua.sinaver.web3.service.IUserService;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "${dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
public class AuthController {

    @Autowired
    private AuthenticationManager authManager;

    @Autowired
    private IUserService userService;

    @Value("${dapp.url}")
    private String dappUri;

    @GetMapping("/nonce")
    public String nonce(HttpSession session) {
        val nonce = RandomStringUtils.random(10, true, true);
        session.setAttribute("nonce", nonce);
        return nonce;
    }

    @PostMapping("/verify")
    public ResponseEntity<String> verify(@RequestBody SiweChallengeMessage siwe, HttpServletRequest request,
            HttpServletResponse response, HttpSession session) {
        log.debug("Siwe Challenge Request: {}", siwe);

        val sessionNonce = (String) session.getAttribute("nonce");
        log.debug("nonce from session {}", sessionNonce);

        // check if nonce match with previosly generated for this session
        if (sessionNonce == null || !siwe.message().nonce().equals(sessionNonce)) {
            log.error("Nonce mismatch!");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        // check if dapp uri match the one it's actually deployed
        if (!siwe.message().uri().equals(dappUri)) {
            log.error("URI mismatch!");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        val authentication = authManager.authenticate(
                new Web3Authentication(siwe.message(), siwe.signature()));

        if (authentication.isAuthenticated()) {
            // save authentication to security context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // remove nonce, so it can't be re-used
            session.removeAttribute("nonce");

            // create a user if not exist
            val signer = authentication.getPrincipal().toString();
            val user = userService.findBySigner(signer);
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
