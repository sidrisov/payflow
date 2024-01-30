package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.FrameMessage;
import ua.sinaver.web3.payflow.message.SocialInsights;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.SocialGraphService;
import ua.sinaver.web3.payflow.service.WalletBalanceService;

import java.net.URI;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicReference;

import static ua.sinaver.web3.payflow.message.ContactMessage.getWalletInsights;

@RestController
@RequestMapping("/farcaster/frames")
@CrossOrigin(origins = "${payflow.dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
public class FarcasterFramesController {

	private static ResponseEntity<String> DEFAULT_HTML_RESPONSE =
			ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body("""
					<!DOCTYPE html>
					<html>
					<head>
					<meta property="fc:frame" content="vNext" />
					<meta property="fc:frame:image" content="https://i.imgur.com/Vs0loYg.png"/>
					</head>
					</html>
					""");
	@Autowired
	private SocialGraphService socialGraphService;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private InvitationRepository invitationRepository;
	@Autowired
	private WalletBalanceService walletBalanceService;

	private static String shortedWalletAddress(String originalAddress) {
		// Extract the first 4 characters
		String prefix = originalAddress.substring(0, 5);
		// Extract the last 4 characters
		String suffix = originalAddress.substring(originalAddress.length() - 3);

		// Combine the prefix, ellipsis, and suffix
		return prefix + "..." + suffix;
	}

	@NotNull
	private static String getInsightsMeta(SocialInsights insights) {
		String insightsMeta = "";
		var buttonIndex = 1;

		if (insights.farcasterFollow() != null) {
			insightsMeta = insightsMeta.concat(String.format(
					"""
							<meta property="fc:frame:button:%s" content="Farcaster %s"/>
							""", buttonIndex, insights.farcasterFollow()));
			buttonIndex++;
		}

		if (insights.lensFollow() != null) {
			insightsMeta = insightsMeta.concat(String.format(
					"""
							<meta property="fc:frame:button:%s" content="Lens %s"/>
							""", buttonIndex, insights.lensFollow()));
			buttonIndex++;
		}

		if (insights.sentTxs() != 0) {
			insightsMeta = insightsMeta.concat(String.format(
					"""
							<meta property="fc:frame:button:%s" content="Transacted %s"/>
							""", buttonIndex,
					insights.sentTxs() == 1 ? "once" : String.format("%s times", insights.sentTxs())));
		}
		return insightsMeta;
	}

	@PostMapping("/connect")
	public ResponseEntity<String> connect(@RequestBody FrameMessage frameMessage) {
		log.debug("Received connect frame: {}", frameMessage);

		val fid = frameMessage.untrustedData().fid();

		val wallet = socialGraphService.getSocialMetadata(
				"fc_fid:".concat(String.valueOf(fid)), null);

		val addresses = wallet.getAddresses();

		log.debug("Addresses for {}: {}", fid, addresses);

		val profiles = getFidProfiles(addresses);

		String html;
		if (!profiles.isEmpty()) {
			log.debug("Found profiles for {}: {}", fid, profiles);

			String profileButtonsMeta = "";

			for (int i = 0; i < profiles.size(); i++) {
				val profile = profiles.get(i);
				profileButtonsMeta = profileButtonsMeta.concat(String.format("""
						<meta property="fc:frame:button:%s" content="✅ %s @%s"/>
						""", i + 1, profile.getDisplayName(), profile.getUsername()));
			}


			html = String.format("""
					<!DOCTYPE html>
					<html>
					<head>
					<meta property="fc:frame" content="vNext" />
					<meta property="fc:frame:image" content="https://i.imgur.com/9b2C82J.jpg"/>
					%s
					<meta property="fc:frame:post_url" content="https://api.alpha.payflow.me/api/farcaster/frames/actions" />
					</head>
					</html>
					""", profileButtonsMeta);
		} else {
			val invitations = addresses.stream()
					.map(address -> invitationRepository.findFirstValidByIdentityOrCode(address, null))
					.filter(Objects::nonNull).limit(4).toList();

			if (!invitations.isEmpty()) {
				String invitedButtonsMeta = "";
				for (int i = 0; i < invitations.size(); i++) {
					invitedButtonsMeta = invitedButtonsMeta.concat(
							String.format("""
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
						<meta property="fc:frame:post_url" content="https://api.alpha.payflow.me/api/farcaster/frames/actions"
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
						                     <meta property="fc:frame:button:1" content="🤷🏻 not invited" />
						              </head>
						        </html>
						""";
			}
		}

		return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(html);
	}

	@PostMapping("/actions")
	public ResponseEntity<String> actions(@RequestBody FrameMessage frameMessage) {
		log.debug("Received actions frame: {}", frameMessage);

		val buttonIndex = frameMessage.untrustedData().buttonIndex();
		val fid = frameMessage.untrustedData().fid();
		val casterFid = frameMessage.untrustedData().castId().fid();

		val wallet = socialGraphService.getSocialMetadata(
				"fc_fid:".concat(String.valueOf(fid)), null);

		val addresses = wallet.getAddresses();

		log.debug("Addresses for {}: {}", fid, addresses);

		val profiles = getFidProfiles(addresses);

		if (!profiles.isEmpty() && buttonIndex > 0 && buttonIndex <= profiles.size()) {
			val clickedProfile = profiles.get(buttonIndex - 1);

			String socialInsightsButton = "";

			var nextButtonIndex = 2;
			if (fid != casterFid) {
				socialInsightsButton = String.format("""
											<meta property="fc:frame:button:%s" content="Social Insights"/>
						""", nextButtonIndex);
				nextButtonIndex++;
			}

			return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(String.format("""
							<!DOCTYPE html>
							<html>
							<head>
							<meta property="fc:frame" content="vNext" />
							<meta property="fc:frame:button:1" content="Balance"/>
							%s
							<meta property="fc:frame:button:%s" content="Profile"/>
							<meta property="fc:frame:button:%s:action" content="post_redirect"/>
							<meta property="fc:frame:image" content="https://i.imgur.com/9b2C82J.jpg"/>
							<meta property="fc:frame:post_url" content="https://api.alpha.payflow.me/api/farcaster/frames/actions/%s" />
							</head>
							</html>
							""", socialInsightsButton, nextButtonIndex, nextButtonIndex,
					clickedProfile.getIdentity()));
		} else {
			val invitations = addresses.stream()
					.map(address -> invitationRepository.findFirstValidByIdentityOrCode(address, null))
					.filter(Objects::nonNull).limit(4).toList();

			if (!invitations.isEmpty() && buttonIndex > 0 && buttonIndex <= invitations.size()) {

				val clickedInvitee = invitations.get(buttonIndex - 1);

				return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(String.format("""
						<!DOCTYPE html>
						<html>
						<head>
						<meta property="fc:frame" content="vNext" />
						<meta property="fc:frame:button:1" content="Sign Up"/>
						<meta property="fc:frame:button:1:action" content="post_redirect"/>
						<meta property="fc:frame:image" content="https://i.imgur.com/9DanrMv.jpg"/>
						<meta property="fc:frame:post_url" content="https://api.alpha.payflow.me/api/farcaster/frames/actions/%s" />
						</head>
						</html>
						""", clickedInvitee.getIdentity()));
			}
		}

		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/actions/{identity}")
	public ResponseEntity<String> identityAction(@PathVariable String identity,
	                                             @RequestBody FrameMessage frameMessage) {
		log.debug("Received actions frame: {}", frameMessage);

		val buttonIndex = frameMessage.untrustedData().buttonIndex();
		val fid = frameMessage.untrustedData().fid();
		val casterFid = frameMessage.untrustedData().castId().fid();

		val wallet = socialGraphService.getSocialMetadata(
				"fc_fid:".concat(String.valueOf(fid)), null);

		val addresses = wallet.getAddresses();

		log.debug("Addresses for {}: {}", fid, addresses);

		val clickedProfile =
				getFidProfiles(addresses).stream().filter(p -> p.getIdentity().equals(identity)).findFirst().orElse(null);

		if (clickedProfile != null && buttonIndex > 0 && buttonIndex <= 3) {

			// handle balance
			if (buttonIndex == 1) {
				val defaultFlow = clickedProfile.getDefaultFlow();

				AtomicReference<String> balance = new AtomicReference<>();
				if (defaultFlow != null) {
					defaultFlow.getWallets().stream()
							.filter(w -> w.getNetwork() == 8453).findFirst()
							.ifPresent(flowBaseWallet -> {
								balance.set(walletBalanceService.getWalletBalance(flowBaseWallet.getAddress()));
							});
				}

				if (balance.get() != null) {

					String balanceMeta = String.format(
							"""
									<meta property="fc:frame:button:1" content="Base: %s ETH"/>
									""", balance.get());

					return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(String.format("""
							<!DOCTYPE html>
							<html>
							<head>
							<meta property="fc:frame" content="vNext" />
							<meta property="fc:frame:image" content="https://i.imgur.com/9b2C82J.jpg"/>
							%s
							</head>
							</html>
							""", balanceMeta));
				}
			}

			// handle insights
			if (buttonIndex == 2 && fid != casterFid) {

				val casterWallet = socialGraphService.getSocialMetadata(
						"fc_fid:".concat(String.valueOf(casterFid)), "fc_fid:".concat(String.valueOf(fid)));

				if (casterWallet != null) {
					val insights = getWalletInsights(casterWallet);
					String insightsMeta = getInsightsMeta(insights);
					return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(String.format("""
							<!DOCTYPE html>
							<html>
							<head>
							<meta property="fc:frame" content="vNext" />
							<meta property="fc:frame:image" content="https://i.imgur.com/9b2C82J.jpg"/>
							%s
							</head>
							</html>
							""", insightsMeta));
				}
			}

			if ((buttonIndex == 2 && fid == casterFid) || (buttonIndex == 3 && fid != casterFid)) {

				try {
					val location = new URI(String.format("https://app.payflow.me/%s",
							clickedProfile.getUsername()));

					log.debug("Redirecting to {}", location);
					return ResponseEntity.status(HttpStatus.FOUND).contentType(MediaType.TEXT_PLAIN).location(location).body(String.format("https://app.payflow.me/%s", clickedProfile.getUsername()));

				} catch (Throwable t) {
					log.debug("Error:", t);
				}
			}
		} else {
			val invitee = invitationRepository.findFirstValidByIdentityOrCode(identity, null);

			if (invitee != null & buttonIndex == 1) {

				try {
					val location = new URI("https://app.payflow.me/connect");

					log.debug("Redirecting to {}", location);
					return ResponseEntity.status(HttpStatus.FOUND).contentType(MediaType.TEXT_PLAIN).location(location).body("https://app.payflow.me/connect");
				} catch (Throwable t) {
					log.debug("Error:", t);
				}
			}
		}

		return DEFAULT_HTML_RESPONSE;
	}

	private List<User> getFidProfiles(List<String> addresses) {
		return addresses.stream().map(address -> userRepository.findByIdentityAndAllowedTrue(address))
				.filter(Objects::nonNull).limit(4).toList();
	}
}
