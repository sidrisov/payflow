package ua.sinaver.web3.payflow.controller;

import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.auth.Web3Authentication;
import ua.sinaver.web3.payflow.message.SiweChallengeMessage;
import ua.sinaver.web3.payflow.service.IUserService;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "${payflow.dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
public class AuthController {

	@Autowired
	private AuthenticationManager authManager;

	@Autowired
	private IUserService userService;

	@Value("${payflow.dapp.url}")
	private String dappUri;

	@GetMapping("/nonce")
	public String nonce(HttpSession session) {
		val nonce = RandomStringUtils.random(10, true, true);
		session.setAttribute("nonce", nonce);
		log.debug("SessionId: {} - nonce: {} ", session.getId(), nonce);
		return nonce;
	}

	@PostMapping("/verify/{identity}")
	public ResponseEntity<String> verify(@PathVariable String identity,
	                                     @RequestBody SiweChallengeMessage siwe,
	                                     HttpSession session) {
		log.debug("SessionId: {} - siwe challenge request: {} for {}", session.getId(), siwe, identity);

		val sessionNonce = (String) session.getAttribute("nonce");
		log.debug("nonce from session {}", sessionNonce);

		// check if nonce match with previously generated for this session

		if (sessionNonce == null || siwe.message().nonce() == null) {
			log.error("Nonce is empty - session: {}, challenge {}", sessionNonce, siwe.message().nonce());
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
		}
		if (!siwe.message().nonce().equals(sessionNonce)) {
			log.error("Nonce mismatch - expected: {}, actual {}", sessionNonce, siwe.message().nonce());
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
		}

		// check if dapp uri match the one it's actually deployed
		if (!siwe.message().uri().equals(dappUri)) {
			log.error("URI mismatch - expected: {}, actual {}", dappUri, siwe.message().uri());
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
		}

		// remove the check since SIWE verification implies using and EOA
		/*if (siwe.message().chainId() != 1 && siwe.message().chainId() != 10) {
			log.error("Wrong chainId  - expected: {} or {}, actual {}", 1, 10, siwe.message().chainId());
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
		}*/

		val authentication = authManager.authenticate(
				new Web3Authentication(identity, siwe.message(), siwe.signature()));

		if (authentication.isAuthenticated()) {
			// save authentication to security context
			SecurityContextHolder.getContext().setAuthentication(authentication);

			// remove nonce, so it can't be re-used
			session.removeAttribute("nonce");

			// create a user if not exist
			val authenticatedIdentity = authentication.getPrincipal().toString();
			val user = userService.findByIdentity(authenticatedIdentity);
			if (user == null) {
				userService.saveUser(authenticatedIdentity);
			}

			return ResponseEntity.ok().build();
		}

		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	}

	@GetMapping("/logout")
	public void logout() {
	}
}
