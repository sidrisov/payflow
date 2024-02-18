package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.Gift;
import ua.sinaver.web3.payflow.data.Invitation;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.*;
import ua.sinaver.web3.payflow.repository.GiftRepository;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.WalletBalanceService;
import ua.sinaver.web3.payflow.service.api.IFarcasterHubService;
import ua.sinaver.web3.payflow.service.api.IFrameService;
import ua.sinaver.web3.payflow.service.api.IUserService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/farcaster/frames")
@Transactional
@Slf4j
public class FramesController {
	private static final String CONNECT_ACTIONS = "/api/farcaster/frames/actions";
	private static final String CONNECT_IDENTITY_ACTIONS = "/api/farcaster/frames/actions/%s";
	private static final String CONNECT_IDENTITY_ACTIONS_INVITE = "/api/farcaster/frames/actions/%s/invite";
	private static final String CONNECT_IDENTITY_ACTIONS_GIFT = "/api/farcaster/frames/actions/%s" +
			"/gift";
	private static final String CONNECT_IDENTITY_ACTIONS_GIFT_BACK = "/api/farcaster/frames" +
			"/actions/%s/gift/back";

	private static final String CONNECT_IDENTITY_ACTIONS_BACK = "/api/farcaster/frames" +
			"/actions/%s/back";
	private static final ResponseEntity<String> DEFAULT_HTML_RESPONSE =
			FrameResponse.builder().image("https://i.imgur.com/Vs0loYg.png").build().toHtmlResponse();
	@Autowired
	private GiftRepository giftRepository;
	@Value("${payflow.dapp.url}")
	private String dAppServiceUrl;
	@Value("${payflow.api.url}")
	private String apiServiceUrl;
	@Value("${payflow.frames.url}")
	private String framesServiceUrl;

	@Autowired
	private IFarcasterHubService farcasterHubService;

	@Autowired
	private InvitationRepository invitationRepository;
	@Autowired
	private WalletBalanceService walletBalanceService;
	@Autowired
	private IdentityService identityService;

	@Autowired
	private IFrameService frameService;

	@Autowired
	private IUserService userService;

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

		val clickedFid = validateMessage.action().interactor().fid();
		val casterFid = validateMessage.action().cast().fid();

		val addresses = frameService.getFidAddresses(clickedFid);
		val profiles = frameService.getFidProfiles(addresses);

		User casterProfile;
		if (clickedFid != casterFid) {
			casterProfile =
					frameService.getFidProfile(casterFid, null);
		} else {
			casterProfile = profiles.stream().findFirst().orElse(null);
		}

		val postUrl = apiServiceUrl.concat(CONNECT_ACTIONS);
		val frameResponseBuilder = FrameResponse.builder().postUrl(postUrl);
		if (!profiles.isEmpty()) {
			log.debug("Found profiles for {}: {}", clickedFid, profiles);
			for (val profile : profiles) {
				frameResponseBuilder.button(new FrameButton(String.format("✅ %s @%s",
						profile.getDisplayName(), profile.getUsername()),
						FrameButton.ActionType.POST, null));
			}
			val image = framesServiceUrl.concat(String.format("/images/profile/%s/welcome.png",
					validateMessage.action().interactor().username()));
			frameResponseBuilder.image(image);
		} else {
			val invitations = userService.getInvitations(addresses);
			if (!invitations.isEmpty()) {
				val image = framesServiceUrl.concat("/images/profile/invited.png");
				val linkUrl = dAppServiceUrl.concat("/connect");
				frameResponseBuilder.image(image).button(new FrameButton(
						"Sign Up", FrameButton.ActionType.LINK, linkUrl));
			} else {
				val image = framesServiceUrl.concat("/images/profile/notinvited.png");
				frameResponseBuilder.image(image);
			}
		}

		if (casterProfile != null) {
			val paymentLink = dAppServiceUrl.concat(String.format("/%s?pay",
					casterProfile.getUsername()));

			frameResponseBuilder.button(new FrameButton("Pay", FrameButton.ActionType.LINK,
					paymentLink));
		}
		return frameResponseBuilder.build().toHtmlResponse();
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

		val clickedFid = validateMessage.action().interactor().fid();

		val buttonIndex = validateMessage.action().tappedButton().index();
		val casterFid = validateMessage.action().cast().fid();

		val profiles = frameService.getFidProfiles(clickedFid);

		if (!profiles.isEmpty()) {
			if (buttonIndex > 0 && buttonIndex <= profiles.size()) {
				val clickedProfile = profiles.get(buttonIndex - 1);
				val postUrl = apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS,
						clickedProfile.getIdentity()));

				val profileLink = dAppServiceUrl.concat(String.format("/%s",
						clickedProfile.getUsername()));
				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
								"/image.png",
						clickedProfile.getIdentity()));

				val responseBuilder = FrameResponse.builder().image(profileImage).postUrl(postUrl)
						.button(new FrameButton("\uD83D\uDCB0 Balance", FrameButton.ActionType.POST,
								null))
						.button(new FrameButton("\uD83D\uDC8C Invite",
								FrameButton.ActionType.POST, null))
						.button(new FrameButton("\uD83C\uDF81 Gift", FrameButton.ActionType.POST,
								null))
						.button(new FrameButton("Profile",
								FrameButton.ActionType.LINK,
								profileLink));
				/*if (fid != casterFid) {
					responseBuilder.button(new FrameButton("Social Insights", FrameButton.ActionType.POST,
							null));
				}*/

				return responseBuilder.build().toHtmlResponse();
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

		val clickedFid = validateMessage.action().interactor().fid();
		val buttonIndex = validateMessage.action().tappedButton().index();
		val casterFid = validateMessage.action().cast().fid();

		val clickedProfile = frameService.getFidProfile(clickedFid, identity);

		if (clickedProfile != null && buttonIndex > 0 && buttonIndex <= 3) {
			val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
							"/image.png",
					clickedProfile.getIdentity()));

			switch (buttonIndex) {
				// balance
				case 1:
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
						return FrameResponse.builder().image(profileImage)
								.button(new FrameButton(
										String.format("Base: %s ETH", balance.get()), FrameButton.ActionType.POST, null))
								.build().toHtmlResponse();
					}
					break;
				// invites
				case 2:
					log.debug("Handling invitation action: {}", validateMessage);
					val invitePostUrl =
							apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_INVITE,
									clickedProfile.getIdentity()));
					return FrameResponse.builder().image(profileImage)
							.postUrl(invitePostUrl)
							.input("Enter farcaster username")
							.button(new FrameButton(
									"Submit", FrameButton.ActionType.POST, null))
							.build().toHtmlResponse();
				// gifts
				case 3:
					log.debug("Handling gift action: {}", validateMessage);
					val giftImage = framesServiceUrl.concat(String.format("/images/profile/%s/gift/image.png",
							clickedProfile.getIdentity()));
					val giftPostUrl =
							apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_GIFT,
									clickedProfile.getIdentity()));
					return FrameResponse.builder().image(giftImage)
							.postUrl(giftPostUrl)
							.button(new FrameButton(
									"\uD83C\uDFB2 Spin a gift", FrameButton.ActionType.POST, null))
							.button(new FrameButton(
									"\uD83C\uDFC6 Leaderboard", FrameButton.ActionType.POST, null))
							.build().toHtmlResponse();
			}
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/actions/{identity}/back")
	public ResponseEntity<String> handleActionsBackAction(@PathVariable String identity,
	                                                      @RequestBody FrameMessage frameMessage) {
		log.debug("Received actions back frame: {}", frameMessage);

		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val clickedFid = validateMessage.action().interactor().fid();
		val buttonIndex = validateMessage.action().tappedButton().index();
		val clickedProfile = frameService.getFidProfile(clickedFid, identity);
		if (clickedProfile != null && buttonIndex == 1) {
			val postUrl = apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS,
					clickedProfile.getIdentity()));
			val profileLink = dAppServiceUrl.concat(String.format("/%s",
					clickedProfile.getUsername()));
			val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
							"/image.png",
					clickedProfile.getIdentity()));
			val responseBuilder = FrameResponse.builder().image(profileImage).postUrl(postUrl)
					.button(new FrameButton("\uD83D\uDCB0 Balance", FrameButton.ActionType.POST,
							null))
					.button(new FrameButton("\uD83D\uDC8C Invite",
							FrameButton.ActionType.POST, null))
					.button(new FrameButton("\uD83C\uDF81 Gift", FrameButton.ActionType.POST,
							null))
					.button(new FrameButton("Profile",
							FrameButton.ActionType.LINK,
							profileLink));
			return responseBuilder.build().toHtmlResponse();
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/actions/{identity}/gift")
	public ResponseEntity<String> handleGiftAction(@PathVariable String identity,
	                                               @RequestBody FrameMessage frameMessage) {
		log.debug("Received actions gift frame: {}", frameMessage);

		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val buttonIndex = validateMessage.action().tappedButton().index();
		val clickedFid = validateMessage.action().interactor().fid();
		val clickedProfile = frameService.getFidProfile(clickedFid, identity);
		if (clickedProfile != null) {

			if (buttonIndex == 1) {
				log.debug("Handling gift spin action: {}", validateMessage);
				var giftImage = "";

				val responseBuilder = FrameResponse.builder();
				try {
					val giftedContact = frameService.giftSpin(clickedProfile);
					giftImage = framesServiceUrl.concat(String.format("/images/profile/%s/gift" +
									"/%s/image.png",
							clickedProfile.getIdentity(), giftedContact.address()));
					val giftPostUrl =
							apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_GIFT,
									clickedProfile.getIdentity()));
					responseBuilder.image(giftImage)
							.postUrl(giftPostUrl)
							.button(new FrameButton(
									"\uD83C\uDFB2 Spin one more time",
									FrameButton.ActionType.POST,
									null));
				} catch (Exception error) {
					giftImage = framesServiceUrl.concat(String.format("/images/profile/%s/gift/image.png?error=%s",
							clickedProfile.getIdentity(),
							error.getMessage()));
					val giftPostUrl =
							apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_BACK,
									clickedProfile.getIdentity()));
					responseBuilder.image(giftImage)
							.postUrl(giftPostUrl)
							.button(new FrameButton(
									"⬅\uFE0F Back",
									FrameButton.ActionType.POST,
									null));
				}

				return responseBuilder
						.button(new FrameButton(
								"\uD83C\uDFC6 Leaderboard", FrameButton.ActionType.POST, null))
						.build().toHtmlResponse();
			} else if (buttonIndex == 2) {
				log.debug("Handling gift leaderboard action: {}", validateMessage);
				val leaderboardImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
						"/gift/leaderboard.png", clickedProfile.getIdentity()));
				val giftPostUrl =
						apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_GIFT_BACK,
								clickedProfile.getIdentity()));
				return FrameResponse.builder().image(leaderboardImage)
						.postUrl(giftPostUrl)
						.button(new FrameButton(
								"⬅\uFE0F Back",
								FrameButton.ActionType.POST,
								null))
						.build().toHtmlResponse();
			}
		}

		return DEFAULT_HTML_RESPONSE;
	}

	@GetMapping("/gift/{identity}/leaderboard")
	public List<GiftProfileMessage> getGiftLeaderboard(@PathVariable String identity) {
		log.debug("Received get gift leaderboard request from: {}", identity);

		try {
			val allGifts = giftRepository.findAllBy();

			// Group gifts by the profile user
			Map<User, List<Gift>> giftsByGiftedUser = allGifts.stream()
					.collect(Collectors.groupingBy(Gift::getGifted));

			// Convert each group into GiftProfileMessage
			return giftsByGiftedUser.entrySet().stream()
					.map(entry -> new GiftProfileMessage(
							ProfileMessage.convert(entry.getKey()),
							entry.getValue().stream()
									.map(gift -> new GiftProfileMessage.GiftMessage(ProfileMessage.convert(gift.getGifter())))
									.collect(Collectors.toList())
					))
					.sorted(Comparator.comparing(gpm -> gpm.gifts().size(), Comparator.reverseOrder()))
					.collect(Collectors.toList());
		} catch (Exception e) {
			log.error("Error:", e);
		}

		return Collections.emptyList();
	}


	@PostMapping("/actions/{identity}/gift/back")
	public ResponseEntity<String> handleGiftBackAction(@PathVariable String identity,
	                                                   @RequestBody FrameMessage frameMessage) {
		log.debug("Received actions gift back frame: {}", frameMessage);

		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val buttonIndex = validateMessage.action().tappedButton().index();
		val clickedFid = validateMessage.action().interactor().fid();
		val clickedProfile = frameService.getFidProfile(clickedFid, identity);
		if (clickedProfile != null) {
			if (buttonIndex == 1) {

				log.debug("Handling gift back action: {}", validateMessage);

				val giftImage = framesServiceUrl.concat(String.format("/images/profile/%s/gift/image.png",
						clickedProfile.getIdentity()));
				val giftPostUrl =
						apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_GIFT,
								clickedProfile.getIdentity()));
				return FrameResponse.builder().image(giftImage)
						.postUrl(giftPostUrl)
						.button(new FrameButton(
								"\uD83C\uDFB2 Spin a gift ", FrameButton.ActionType.POST, null))
						.button(new FrameButton(
								"\uD83C\uDFC6 Leaderboard ", FrameButton.ActionType.POST, null))
						.build().toHtmlResponse();
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

		val clickedFid = validateMessage.action().interactor().fid();
		val buttonIndex = validateMessage.action().tappedButton().index();
		val inputText = validateMessage.action().input().text();
		val clickedProfile = frameService.getFidProfile(clickedFid, identity);

		if (clickedProfile != null && buttonIndex == 1) {
			if (!StringUtils.isBlank(inputText)) {
				// check if profile exist
				val inviteProfile = frameService.getFidProfile(inputText, identity);
				if (inviteProfile != null) {
					return FrameResponse.builder().image("https://i.imgur.com/9b2C82J.jpg")
							.button(new FrameButton(String.format("✅ %s already signed up",
									inputText), FrameButton.ActionType.POST, null)).build().toHtmlResponse();
				} else {
					// check if invited
					val inviteAddresses = frameService.getFnameAddresses(inputText);
					val invitations = userService.getInvitations(inviteAddresses);
					if (!invitations.isEmpty()) {
						return FrameResponse.builder().image("https://i.imgur.com/9b2C82J.jpg")
								.button(new FrameButton(String.format("✅ %s already invited",
										inputText), FrameButton.ActionType.POST, null)).build().toHtmlResponse();
					} else {
						// for now invite first
						val identityToInvite =
								identityService.getIdentitiesInfo(inviteAddresses).stream().sorted(Comparator.comparingInt(IdentityMessage::score).reversed()).toList().getFirst();
						log.debug("Identity to invite: {} ", identityToInvite);

						val invitation = new Invitation(identityToInvite.address(), null);
						invitation.setInvitedBy(clickedProfile);
						invitation.setExpiryDate(new Date(System.currentTimeMillis() + TimeUnit.DAYS.toMillis(30)));
						invitationRepository.save(invitation);

						return FrameResponse.builder().image("https://i.imgur.com/9b2C82J.jpg")
								.button(new FrameButton(String.format("🎉 Successfully invited %s to Payflow",
										inputText), FrameButton.ActionType.POST, null)).build().toHtmlResponse();
					}
				}
			} else {
				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
								"/image.png",
						clickedProfile.getIdentity()));
				val postUrl = apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_INVITE,
						clickedProfile.getIdentity()));

				return FrameResponse.builder().image(profileImage)
						.postUrl(postUrl)
						.input("Enter farcaster username")
						.button(new FrameButton(
								"Empty username, submit again", FrameButton.ActionType.POST, null))
						.build().toHtmlResponse();
			}
		}
		return DEFAULT_HTML_RESPONSE;
	}
}
