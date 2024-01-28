package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.FrameMessage;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.SocialGraphService;

import java.util.Objects;

@RestController
@RequestMapping("/farcaster/frames")
@CrossOrigin(origins = "${payflow.dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
public class FcFramesController {

	@Autowired
	private SocialGraphService socialGraphService;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private InvitationRepository invitationRepository;

	private static String shortedWalletAddress(String originalAddress) {
		// Extract the first 4 characters
		String prefix = originalAddress.substring(0, 5);
		// Extract the last 4 characters
		String suffix = originalAddress.substring(originalAddress.length() - 3);

		// Combine the prefix, ellipsis, and suffix
		return prefix + "..." + suffix;
	}

	@PostMapping("/connect")
	public ResponseEntity<String> connect(@RequestBody FrameMessage frameMessage) {
		log.debug("Received connect frame: {}", frameMessage);

		val fid = frameMessage.untrustedData().fid();

		val wallet = socialGraphService.getSocialMetadata("fc_fid:".concat(String.valueOf(fid)),
				"dummyethwallet.eth");

		val addresses = wallet.getAddresses();

		log.debug("Addresses for {}: {}", fid, addresses);


		val profiles =
				addresses.stream().map(address -> userRepository.findByIdentityAndAllowedTrue(address))
						.filter(Objects::nonNull).limit(4).toList();

		String html;
		if (!profiles.isEmpty()) {
			log.debug("Found profiles for {}: {}", fid, profiles);

			String profileButtonsMeta = "";

			for (int i = 0; i < profiles.size(); i++) {
				profileButtonsMeta = profileButtonsMeta.concat(String.format(
						"""
								<meta property="fc:frame:button:%s" content="✅ %s @%s"/>
								""", i + 1, profiles.get(i).getDisplayName(), profiles.get(i).getUsername()));
			}

			html = String.format("""
					<!DOCTYPE html>
					<html>
					<head>
					<meta property="fc:frame" content="vNext" />
					<meta property="fc:frame:image" content="https://i.imgur.com/9b2C82J.jpg"/>
					%s
					</head>
					</html>
					""", profileButtonsMeta);
		} else {
			val invitations =
					addresses.stream().map(address -> invitationRepository.findFirstValidByIdentityOrCode(address, null))
							.filter(Objects::nonNull).limit(4).toList();

			if (!invitations.isEmpty()) {
				String invitedButtonsMeta = "";
				for (int i = 0; i < invitations.size(); i++) {
					invitedButtonsMeta = invitedButtonsMeta.concat(
							String.format(
									"""
											<meta property="fc:frame:button:%s" content="🎉 %s invited by @%s"/>
											""", i + 1,
									shortedWalletAddress(invitations.get(i).getIdentity()),
									invitations.get(i).getInvitedBy().getUsername()));
				}

				html = String.format("""
						<!DOCTYPE html>
						<html>
						<head>
						<meta property="fc:frame" content="vNext" />
						<meta property="fc:frame:image" content="https://i.imgur.com/9DanrMv.jpg"/>
						%s
						</head>
						</html>
						""", invitedButtonsMeta);
			} else {
				html = """
						<!DOCTYPE html>
						          <html>
						              <head>
						                  <meta property="fc:frame" content="vNext" />
						                     <meta property="fc:frame:image" content="https://i.imgur.com/J1mYWw1.jpg"/>
						                     <meta property="fc:frame:button:1" content="You don't have invitation 🤷🏻‍" />
						              </head>
						        </html>
						""";
			}
		}

		return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(html);

	}

	@PostMapping("/actions")
	public ResponseEntity<String> actions(@RequestBody FrameMessage frameMessage) {
		log.debug("Received action frame: {}", frameMessage);

		return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body("""
				<!DOCTYPE html>
				          <html>
				              <head>
				                  <meta property="fc:frame" content="vNext" />
				                     <meta property="fc:frame:image" content="https://drive.google.com/uc?id=12uZfK2BiPoVQOVJt1Kh2H9usgN29H_Dq"/>
				              </head>
				        </html>
				""");

	}
}
