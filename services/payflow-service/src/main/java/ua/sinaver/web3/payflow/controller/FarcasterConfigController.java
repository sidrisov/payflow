package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.service.UserService;

import java.security.Principal;

@RestController
@RequestMapping("/farcaster/config")
@Slf4j
@Transactional
@CrossOrigin(origins = {"${payflow.dapp.url}"}, allowCredentials = "true")
public class FarcasterConfigController {
	@Autowired
	private UserService userService;

	@PutMapping("/client")
	@ResponseStatus(HttpStatus.OK)
	public void updatePreferred(Principal principal,
	                            @RequestBody User.FarcasterClient farcasterClient) {
		if (principal == null) {
			throw new BadCredentialsException("No authentication provided!");
		}

		log.debug("{} updating preferred farcaster client: {}", principal.getName(),
				farcasterClient);
		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			throw new UsernameNotFoundException("User not found!");
		}
		user.setPreferredFarcasterClient(farcasterClient);
		userService.saveUser(user);
	}

}
