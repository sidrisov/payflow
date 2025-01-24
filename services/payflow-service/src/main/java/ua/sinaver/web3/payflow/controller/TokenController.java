package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.entity.PreferredTokens;
import ua.sinaver.web3.payflow.message.Token;
import ua.sinaver.web3.payflow.service.TokenService;
import ua.sinaver.web3.payflow.service.UserService;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/tokens")
@Slf4j
@Transactional
@CrossOrigin(origins = {"${payflow.dapp.url}"}, allowCredentials = "true")
public class TokenController {
	@Autowired
	private UserService userService;

	@Autowired
	private TokenService tokenService;

	@GetMapping
	public List<Token> getAllTokens() {
		return tokenService.getTokens();
	}

	@PutMapping("/preferred")
	@ResponseStatus(HttpStatus.OK)
	public void updatePreferred(Principal principal, @RequestBody List<String> tokens) {
		if (principal == null) {
			throw new BadCredentialsException("No authentication provided!");
		}

		if (tokens == null) {
			throw new IllegalArgumentException("Tokens list cannot be null");
		}

		log.debug("{} updating preferred tokens: {}", principal.getName(), tokens);
		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			throw new UsernameNotFoundException("User not found!");
		}

		var preferredTokens = (PreferredTokens) user.getPreferredTokens();
		if (preferredTokens == null) {
			preferredTokens = new PreferredTokens();
			preferredTokens.setUser(user);
			user.setPreferredTokens(preferredTokens);
		}

		preferredTokens.setTokens(String.join(",", tokens));
		userService.saveUser(user);
	}

}
