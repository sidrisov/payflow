package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.Invitation;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.FrameMessage;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.message.SocialInsights;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.IFarcasterHubService;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.SocialGraphService;
import ua.sinaver.web3.payflow.service.WalletBalanceService;

import java.net.URI;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static ua.sinaver.web3.payflow.message.ContactMessage.getWalletInsights;

// TODO: create template builder
@RestController
@RequestMapping("/farcaster/frames")
@Transactional
@Slf4j
public class FarcasterFramesController {
	private static final String CONNECT_ACTIONS = "/api/farcaster/frames/actions";
	private static final String CONNECT_IDENTITY_ACTIONS = "/api/farcaster/frames/actions/%s";
	private static final String CONNECT_IDENTITY_ACTIONS_INVITE = "/api/farcaster/frames/actions/%s/invite";
	private static final ResponseEntity<String> DEFAULT_HTML_RESPONSE =
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
	private IFarcasterHubService farcasterHubService;
	@Value("${payflow.dapp.url}")
	private String dAppServiceUrl;
	@Value("${payflow.api.url}")
	private String apiServiceUrl;
	@Autowired
	private SocialGraphService socialGraphService;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private InvitationRepository invitationRepository;
	@Autowired
	private WalletBalanceService walletBalanceService;
	@Autowired
	private IdentityService identityService;

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

		if (insightsMeta.isEmpty()) {
			insightsMeta = insightsMeta.concat(String.format(
					"""
							<meta property="fc:frame:button:%s" content="🤷🏻 No social insights between you"/>
							""", buttonIndex));
		}
		return insightsMeta;
	}

	@PostMapping("/connect")
	public ResponseEntity<String> connect(@RequestBody FrameMessage frameMessage) {
		log.debug("Received connect frame message request: {}", frameMessage);


		val validateMessage =
				farcasterHubService.validateFrameMessageWithNeynar(
						frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val fid = validateMessage.action().interactor().fid();

		// evict cache
		socialGraphService.cleanCache("fc_fid:".concat(String.valueOf(fid)), null);
		val wallet = socialGraphService.getSocialMetadata(
				"fc_fid:".concat(String.valueOf(fid)), null);

		val addresses = wallet.getAddresses();

		log.debug("Addresses for {}: {}", fid, addresses);

		val profiles = getFidProfiles(addresses);

		val casterFid = validateMessage.action().cast().fid();

		User casterProfile;
		if (fid != casterFid) {
			val casterWallet = socialGraphService.getSocialMetadata(
					"fc_fid:".concat(String.valueOf(casterFid)), null);
			casterProfile =
					getFidProfiles(casterWallet.getAddresses()).stream().findFirst().orElse(null);
		} else {
			casterProfile = profiles.stream().findFirst().orElse(null);
		}

		String payMeta = "";
		if (casterProfile != null) {
			val paymentLink = dAppServiceUrl.concat(String.format("/%s?pay",
					casterProfile.getUsername()));
			payMeta = String.format("""
					<meta property="fc:frame:button:next_button_index" content="Pay"/>
					<meta property="fc:frame:button:next_button_index:action" content="link"/>
					<meta property="fc:frame:button:next_button_index:target" content="%s" />
					""", paymentLink);
		}

		val postUrl = apiServiceUrl.concat(CONNECT_ACTIONS);
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

			if (!StringUtils.isEmpty(payMeta)) {
				val payButtonIndex = profiles.size() + 1;
				payMeta = payMeta.replace("next_button_index", String.valueOf(payButtonIndex));
			}

			html = String.format("""
					<!DOCTYPE html>
					<html>
					<head>
					<meta property="fc:frame" content="vNext" />
					<meta property="fc:frame:image" content="https://i.imgur.com/9b2C82J.jpg"/>
					%s
					%s
					<meta property="fc:frame:post_url" content="%s" />
					</head>
					</html>
					""", profileButtonsMeta, payMeta, postUrl);
		} else {
			val invitations = getInvitations(addresses);

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

				if (!StringUtils.isEmpty(payMeta)) {
					val payButtonIndex = invitations.size() + 1;
					payMeta = payMeta.replace("next_button_index", String.valueOf(payButtonIndex));
				}

				html = String.format("""
						<!DOCTYPE html>
						<html>
						<head>
						<meta property="fc:frame" content="vNext" />
						<meta property="fc:frame:image" content="https://i.imgur.com/9DanrMv.jpg"/>
						%s
						%s
						<meta property="fc:frame:post_url" content="%s"
						</head>
						</html>
						""", invitedButtonsMeta, payMeta, postUrl);
			} else {
				if (!StringUtils.isEmpty(payMeta)) {
					val payButtonIndex = 2;
					payMeta = payMeta.replace("next_button_index", String.valueOf(payButtonIndex));
				}

				html = String.format("""
						<!DOCTYPE html>
						          <html>
						              <head>
						                  <meta property="fc:frame" content="vNext" />
						                     <meta property="fc:frame:image" content="https://i.imgur.com/J1mYWw1.jpg"/>
						                     <meta property="fc:frame:button:1" content="🤷🏻 Not invited" />
						                     %s
						                     <meta property="fc:frame:post_url" content="%s"
						              </head>
						        </html>
						""", payMeta, postUrl);
			}
		}

		return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(html);
	}

	@PostMapping("/actions")
	public ResponseEntity<String> actions(@RequestBody FrameMessage frameMessage) {
		log.debug("Received actions frame: {}", frameMessage);

		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());


		val fid = validateMessage.action().interactor().fid();

		val buttonIndex = validateMessage.action().tappedButton().index();
		val casterFid = validateMessage.action().cast().fid();

		// evict cache
		socialGraphService.cleanCache("fc_fid:".concat(String.valueOf(fid)), null);
		val wallet = socialGraphService.getSocialMetadata(
				"fc_fid:".concat(String.valueOf(fid)), null);

		val addresses = wallet.getAddresses();

		log.debug("Addresses for {}: {}", fid, addresses);

		val profiles = getFidProfiles(addresses);

		User casterProfile;
		if (fid != casterFid) {
			val casterWallet = socialGraphService.getSocialMetadata(
					"fc_fid:".concat(String.valueOf(casterFid)), null);
			casterProfile =
					getFidProfiles(casterWallet.getAddresses()).stream().findFirst().orElse(null);
		} else {
			casterProfile = profiles.stream().findFirst().orElse(null);
		}

		if (!profiles.isEmpty()) {
			if (buttonIndex > 0 && buttonIndex <= profiles.size()) {
				val clickedProfile = profiles.get(buttonIndex - 1);
				val postUrl = apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS,
						clickedProfile.getIdentity()));

				String socialInsightsButton = "";

				var nextButtonIndex = 3;
				if (fid != casterFid) {
					socialInsightsButton = String.format("""
												<meta property="fc:frame:button:%s" content="Social Insights"/>
							""", nextButtonIndex);
					nextButtonIndex++;
				}

				val profileLink = dAppServiceUrl.concat(String.format("/%s",
						clickedProfile.getUsername()));
				return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(String.format("""
								<!DOCTYPE html>
								<html>
								<head>
								<meta property="fc:frame" content="vNext" />
								<meta property="fc:frame:button:1" content="Balance"/>
								<meta property="fc:frame:button:2" content="Invite"/>
								%s
								<meta property="fc:frame:button:%s" content="Profile"/>
								<meta property="fc:frame:button:%s:action" content="link"/>
								<meta property="fc:frame:button:%s:target" content="%s" />
								<meta property="fc:frame:image" content="https://i.imgur.com/9b2C82J.jpg"/>
								<meta property="fc:frame:post_url" content="%s" />
								</head>
								</html>
								""", socialInsightsButton, nextButtonIndex, nextButtonIndex,
						nextButtonIndex, profileLink, postUrl));
			}
		} else {
			val invitations = getInvitations(addresses);

			if (!invitations.isEmpty() && buttonIndex == 1) {
				val linkUrl = dAppServiceUrl.concat("/connect");
				return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(String.format("""
						<!DOCTYPE html>
						<html>
						<head>
						<meta property="fc:frame" content="vNext" />
						<meta property="fc:frame:button:1" content="Sign Up"/>
						<meta property="fc:frame:button:1:action" content="link"/>
						<meta property="fc:frame:button:1:target" content="%s" />
						<meta property="fc:frame:image" content="https://i.imgur.com/9DanrMv.jpg"/>
						</head>
						</html>
						""", linkUrl));
			}

			if (casterProfile != null && buttonIndex == 2) {
				log.debug("Handling profile payment action: {}", validateMessage);
				try {
					val location = new URI(dAppServiceUrl.concat(String.format("/%s?pay",
							casterProfile.getUsername())));

					log.debug("Redirecting to {}", location);
					return ResponseEntity.status(HttpStatus.FOUND).location(location).build();
				} catch (Throwable t) {
					log.debug("Error:", t);
				}
			}
		}

		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/actions/{identity}")
	public ResponseEntity<String> identityAction(@PathVariable String identity,
	                                             @RequestBody FrameMessage frameMessage) {
		log.debug("Received actions frame: {}", frameMessage);

		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val fid = validateMessage.action().interactor().fid();
		val buttonIndex = validateMessage.action().tappedButton().index();
		val casterFid = validateMessage.action().cast().fid();

		// evict cache
		socialGraphService.cleanCache("fc_fid:".concat(String.valueOf(fid)), null);
		val wallet = socialGraphService.getSocialMetadata(
				"fc_fid:".concat(String.valueOf(fid)), null);

		val addresses = wallet.getAddresses();

		log.debug("Addresses for {}: {}", fid, addresses);

		val clickedProfile =
				getFidProfiles(addresses).stream().filter(p -> p.getIdentity().equals(identity)).findFirst().orElse(null);

		if (clickedProfile != null && buttonIndex > 0 && buttonIndex <= 4) {

			// handle balance
			if (buttonIndex == 1) {

				log.debug("Handling balance action: {}", validateMessage);

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
					return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(String.format("""
							<!DOCTYPE html>
							<html>
							<head>
							<meta property="fc:frame" content="vNext" />
							<meta property="fc:frame:image" content="https://i.imgur.com/9b2C82J.jpg"/>
							<meta property="fc:frame:button:1" content="Base: %s ETH"/>
							</head>
							</html>
							""", balance.get()));
				}
			}

			if (buttonIndex == 2) {
				log.debug("Handling invitation action: {}", validateMessage);

				val postUrl = apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_INVITE,
						clickedProfile.getIdentity()));
				return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(String.format("""
						<!DOCTYPE html>
						<html>
						<head>
						<meta property="fc:frame" content="vNext" />
						<meta property="fc:frame:image" content="https://i.imgur.com/9b2C82J.jpg"/>
						<meta property="fc:frame:input:text" content="Enter username to invite ..." />
						<meta property="fc:frame:button:1" content="Submit"/>
						<meta property="fc:frame:post_url" content="%s" />
						</head>
						</html>
						""", postUrl));
			}

			// handle insights
			if (buttonIndex == 3 && fid != casterFid) {

				log.debug("Handling insights action: {}", validateMessage);

				// clean cache
				socialGraphService.cleanCache(String.format("fc_fid:%s", casterFid),
						String.format("fc_fid:%s", fid));
				val casterWallet = socialGraphService.getSocialMetadata(
						String.format("fc_fid:%s", casterFid),
						String.format("fc_fid:%s", fid));

				log.debug("Found caster wallet meta {}", casterWallet);
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
		}

		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/actions/{identity}/invite")
	public ResponseEntity<String> identityActionInvite(@PathVariable String identity,
	                                                   @RequestBody FrameMessage frameMessage) {
		log.debug("Received actions invite frame: {}", frameMessage);

		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val fid = validateMessage.action().interactor().fid();

		val buttonIndex = validateMessage.action().tappedButton().index();
		val inputText = validateMessage.action().input().text();

		// evict cache
		socialGraphService.cleanCache("fc_fid:".concat(String.valueOf(fid)), null);
		val wallet = socialGraphService.getSocialMetadata(
				"fc_fid:".concat(String.valueOf(fid)), null);

		val addresses = wallet.getAddresses();

		log.debug("Addresses for {}: {}", fid, addresses);

		val clickedProfile =
				getFidProfiles(addresses).stream().filter(p -> p.getIdentity().equals(identity)).findFirst().orElse(null);
		if (clickedProfile != null && buttonIndex == 1) {

			if (!StringUtils.isBlank(inputText)) {
				// check if profile exist

				// evict cache
				socialGraphService.cleanCache("fc_fname:".concat(inputText), null);
				val inviteWallet = socialGraphService.getSocialMetadata(
						"fc_fname:".concat(inputText), null);

				val inviteAddresses = inviteWallet.getAddresses();

				log.debug("Addresses for fname {}: {}", inputText, inviteAddresses);

				val inviteProfile =
						getFidProfiles(inviteAddresses).stream().filter(p -> p.getIdentity().equals(identity)).findFirst().orElse(null);

				if (inviteProfile != null) {
					return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(String.format("""
							<!DOCTYPE html>
							<html>
							<head>
							<meta property="fc:frame" content="vNext" />
							<meta property="fc:frame:image" content="https://i.imgur.com/9b2C82J.jpg"/>
							<meta property="fc:frame:button:1" content="✅ %s already signed up"/>
							</head>
							</html>
							""", inputText));
				} else {
					// check if invited
					val invitations = getInvitations(inviteAddresses);

					if (!invitations.isEmpty()) {
						return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(String.format("""
								<!DOCTYPE html>
								<html>
								<head>
								<meta property="fc:frame" content="vNext" />
								<meta property="fc:frame:image" content="https://i.imgur.com/9b2C82J.jpg"/>
								<meta property="fc:frame:button:1" content="✅ %s already invited"/>
								</head>
								</html>
								""", inputText));
					} else {
						// for now invite first

						val identityToInvite =
								identityService.getIdentitiesInfo(inviteAddresses).stream().sorted(Comparator.comparingInt(IdentityMessage::score).reversed()).toList().getFirst();
						log.debug("Identity to invite: {} ", identityToInvite);

						val invitation = new Invitation(identityToInvite.address(), null);
						invitation.setInvitedBy(clickedProfile);
						invitation.setExpiryDate(new Date(System.currentTimeMillis() + TimeUnit.DAYS.toMillis(30)));
						invitationRepository.save(invitation);

						return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(String.format("""
								<!DOCTYPE html>
								<html>
								<head>
								<meta property="fc:frame" content="vNext" />
								<meta property="fc:frame:image" content="https://i.imgur.com/9b2C82J.jpg"/>
								<meta property="fc:frame:button:1" content="🎉 Successfully invited %s to Payflow"/>
								</head>
								</html>
								""", inputText));
					}
				}
			} else {
				val postUrl = apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_INVITE,
						clickedProfile.getIdentity()));
				return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(String.format("""
						<!DOCTYPE html>
						<html>
						<head>
						<meta property="fc:frame" content="vNext" />
						<meta property="fc:frame:image" content="https://i.imgur.com/9b2C82J.jpg"/>
						<meta property="fc:frame:input:text" content="Enter username to invite ..." />
						<meta property="fc:frame:button:1" content="Empty username, submit again"/>
						<meta property="fc:frame:post_url" content="%s" />
						</head>
						</html>
						""", postUrl));
			}

		}

		return DEFAULT_HTML_RESPONSE;
	}

	private List<User> getFidProfiles(List<String> addresses) {
		return addresses.stream().map(address -> userRepository.findByIdentityAndAllowedTrue(address))
				.filter(Objects::nonNull).limit(3).toList();
	}

	private List<Invitation> getInvitations(List<String> addresses) {
		return addresses.stream()
				.map(address -> invitationRepository.findFirstValidByIdentityOrCode(address, null))
				.filter(Objects::nonNull).limit(3).toList();
	}
}
