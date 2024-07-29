package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.sinaver.web3.payflow.message.ContactWithFanTokenAuction;
import ua.sinaver.web3.payflow.service.FanTokenService;
import ua.sinaver.web3.payflow.service.UserService;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/info")
@CrossOrigin(origins = "${payflow.dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
public class InfoController {

	@Autowired
	private UserService userService;

	@Autowired
	private FanTokenService fanTokenService;

	@GetMapping("/farcaster/moxie/auctions")
	public List<ContactWithFanTokenAuction> getFanTokenAuctionAmongContacts(Principal principal) {
		if (principal != null) {
			val user = userService.findByIdentity(principal.getName());
			if (user != null) {
				// TODO: a bit hacky, but is good enough for now! better to keep track each
				//  record with cachedTimestamp
				val cachedFanTokens = fanTokenService.getFanTokenAuctionsAmongContacts(user);
				return fanTokenService.refreshTokensMeta(cachedFanTokens);
			} else {
				throw new UsernameNotFoundException("User not found!");
			}
		}
		throw new BadCredentialsException("No authentication provided!");
	}
}
