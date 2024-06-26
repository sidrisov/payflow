package ua.sinaver.web3.payflow.controller.frames;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.data.Gift;
import ua.sinaver.web3.payflow.data.Invitation;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.FrameButton;
import ua.sinaver.web3.payflow.message.GiftProfileMessage;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.message.ProfileMessage;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.repository.GiftRepository;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.TransactionService;
import ua.sinaver.web3.payflow.service.api.IContactBookService;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.service.api.IFrameService;
import ua.sinaver.web3.payflow.service.api.ISocialGraphService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static ua.sinaver.web3.payflow.controller.frames.FramePaymentController.PAY;
import static ua.sinaver.web3.payflow.utils.FrameResponse.BACK_FRAME_BUTTON;

@RestController
@RequestMapping("/farcaster/frames")
@Transactional
@Slf4j
public class FramesController {
	public static final ResponseEntity<String> DEFAULT_HTML_RESPONSE =
			FrameResponse.builder().imageUrl("https://i.imgur.com/Vs0loYg.png").build().toHtmlResponse();
	public static final String BASE_PATH = "/api/farcaster/frames";
	private static final String CONNECT_ACTIONS = BASE_PATH +
			"/actions";
	private static final String CONNECT_IDENTITY_ACTIONS = BASE_PATH +
			"/actions/%s";
	private static final String CONNECT_IDENTITY_ACTIONS_INVITE = BASE_PATH +
			"/actions/%s/invite";
	private static final String CONNECT_IDENTITY_ACTIONS_GIFT = BASE_PATH +
			"/actions/%s/gift";
	private static final String CONNECT_IDENTITY_ACTIONS_GIFT_BACK = BASE_PATH +
			"/actions/%s/gift/back";
	private static final String CONNECT_IDENTITY_ACTIONS_BACK = BASE_PATH +
			"/actions/%s/back";

	@Autowired
	private GiftRepository giftRepository;
	@Value("${payflow.dapp.url}")
	private String dAppServiceUrl;
	@Value("${payflow.api.url}")
	private String apiServiceUrl;
	@Value("${payflow.frames.url}")
	private String framesServiceUrl;
	@Autowired
	private IFarcasterNeynarService neynarService;
	@Autowired
	private InvitationRepository invitationRepository;
	@Autowired
	private IdentityService identityService;
	@Autowired
	private IFrameService frameService;
	@Autowired
	private ISocialGraphService socialGraphService;
	@Autowired
	private IContactBookService contactBookService;
	@Autowired
	private TransactionService transactionService;

	@PostMapping("/connect")
	public ResponseEntity<String> connect(@RequestBody FrameMessage frameMessage) {
		log.debug("Received connect frame message request: {}", frameMessage);
		val validateMessage =
				neynarService.validateFrameMessageWithNeynar(
						frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val castInteractor = validateMessage.action().interactor();
		val castAuthor = validateMessage.action().cast().author() != null ?
				validateMessage.action().cast().author() :
				neynarService.fetchFarcasterUser(validateMessage.action().cast().fid());

		// clear cache only on connect
		socialGraphService.cleanCache("fc_fid:".concat(String.valueOf(castInteractor)));

		val profiles = identityService.getProfiles(castInteractor.addresses());

		User casterProfile;
		if (castInteractor.fid() != castAuthor.fid()) {
			casterProfile = identityService.getProfiles(castAuthor.addresses())
					.stream().findFirst().orElse(null);
		} else {
			casterProfile = profiles.stream().findFirst().orElse(null);
		}

		val postUrl = apiServiceUrl.concat(CONNECT_ACTIONS);
		val frameResponseBuilder = FrameResponse.builder().postUrl(postUrl);
		if (!profiles.isEmpty()) {
			log.debug("Found profiles for {}: {}", castInteractor, profiles);
			for (val profile : profiles) {
				frameResponseBuilder.button(new FrameButton(String.format("✅ %s @%s",
						profile.getDisplayName(), profile.getUsername()),
						FrameButton.ActionType.POST, null));
			}
			val image = framesServiceUrl.concat(String.format("/images/profile/%s/welcome.png",
					validateMessage.action().interactor().username()));
			frameResponseBuilder.imageUrl(image);
		} else {
			val invitations = contactBookService.filterByInvited(castInteractor.addresses());
			log.debug("Invitations for addresses {} {}", castInteractor.addresses(), invitations);

			if (!invitations.isEmpty()) {
				val image = framesServiceUrl.concat("/images/profile/invited.png");
				val linkUrl = dAppServiceUrl.concat("/connect");
				frameResponseBuilder.imageUrl(image)
						.cacheImage(false)
						.button(new FrameButton("Sign Up", FrameButton.ActionType.LINK, linkUrl));
			} else {
				val image = framesServiceUrl.concat("/images/profile/notinvited.png");
				frameResponseBuilder.imageUrl(image);
			}
		}

		if (casterProfile != null) {
			frameResponseBuilder.button(new FrameButton("\uD83D\uDCB8 Pay",
					FrameButton.ActionType.POST,
					apiServiceUrl.concat(String.format(PAY, casterProfile.getIdentity()))));
		}
		return frameResponseBuilder.build().toHtmlResponse();
	}

	@PostMapping("/actions")
	public ResponseEntity<String> actions(@RequestBody FrameMessage frameMessage) {
		log.debug("Received actions frame: {}", frameMessage);

		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val clickedFid = validateMessage.action().interactor().fid();

		val buttonIndex = validateMessage.action().tappedButton().index();
		val profiles = identityService.getProfiles(clickedFid);

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

				val responseBuilder = FrameResponse.builder().imageUrl(profileImage).postUrl(postUrl)
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
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/actions/{identity}")
	public ResponseEntity<String> identityAction(@PathVariable String identity,
	                                             @RequestBody FrameMessage frameMessage) {
		log.debug("Received actions frame: {}", frameMessage);

		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val clickedFid = validateMessage.action().interactor().fid();
		val buttonIndex = validateMessage.action().tappedButton().index();
		val clickedProfile = identityService.getFidProfile(clickedFid, identity);

		if (clickedProfile != null && buttonIndex > 0 && buttonIndex <= 3) {
			val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
							"/image.png",
					clickedProfile.getIdentity()));

			switch (buttonIndex) {
				// balance
				case 1:
					log.debug("Handling balance action: {}", validateMessage);
					val defaultFlow = clickedProfile.getDefaultFlow();
					AtomicReference<Map<String, String>> balances = new AtomicReference<>();
					if (defaultFlow != null) {
						defaultFlow.getWallets().stream()
								.filter(w -> w.getNetwork() == 8453).findFirst()
								.ifPresent(flowBaseWallet -> {
									balances.set(transactionService.getWalletBalance(flowBaseWallet.getAddress()));
								});
					}
					if (balances.get() != null) {
						val balanceImageBase = framesServiceUrl.concat(String.format("/images" +
										"/profile" +
										"/%s" +
										"/balance.png",
								clickedProfile.getIdentity()));
						val balanceImageBuilder =
								UriComponentsBuilder.fromHttpUrl(balanceImageBase);
						balances.get().forEach(balanceImageBuilder::queryParam);
						val balanceImage = balanceImageBuilder.build().toUriString();
						val giftPostUrl =
								apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_BACK,
										clickedProfile.getIdentity()));
						return FrameResponse.builder().imageUrl(balanceImage)
								.postUrl(giftPostUrl)
								.button(BACK_FRAME_BUTTON)
								.build().toHtmlResponse();
					}
					break;
				// invites
				case 2:
					log.debug("Handling invitation action: {}", validateMessage);
					val invitePostUrl =
							apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_INVITE,
									clickedProfile.getIdentity()));
					return FrameResponse.builder().imageUrl(profileImage)
							.postUrl(invitePostUrl)
							.textInput("Enter farcaster username")
							.button(BACK_FRAME_BUTTON)
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
					return FrameResponse.builder().imageUrl(giftImage)
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

		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val clickedFid = validateMessage.action().interactor().fid();
		val buttonIndex = validateMessage.action().tappedButton().index();
		val clickedProfile = identityService.getFidProfile(clickedFid, identity);
		if (clickedProfile != null) {
			if (buttonIndex == 1) {
				val postUrl = apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS,
						clickedProfile.getIdentity()));
				val profileLink = dAppServiceUrl.concat(String.format("/%s",
						clickedProfile.getUsername()));
				val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
								"/image.png",
						clickedProfile.getIdentity()));
				val responseBuilder = FrameResponse.builder().imageUrl(profileImage).postUrl(postUrl)
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
				// TODO: a bit hacky, as other frames might also have additional buttons besides
				//  back button
			} else if (buttonIndex == 2) {
				log.debug("Handling gift leaderboard action: {}", validateMessage);
				val leaderboardImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
						"/gift/leaderboard.png", clickedProfile.getIdentity()));
				val giftPostUrl =
						apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_GIFT_BACK,
								clickedProfile.getIdentity()));
				return FrameResponse.builder()
						.imageUrl(leaderboardImage).cacheImage(false)
						.postUrl(giftPostUrl)
						.button(BACK_FRAME_BUTTON)
						.build().toHtmlResponse();
			}
		}
		return DEFAULT_HTML_RESPONSE;
	}

	@PostMapping("/actions/{identity}/gift")
	public ResponseEntity<String> handleGiftAction(@PathVariable String identity,
	                                               @RequestBody FrameMessage frameMessage) {
		log.debug("Received actions gift frame: {}", frameMessage);

		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val buttonIndex = validateMessage.action().tappedButton().index();
		val clickedFid = validateMessage.action().interactor().fid();
		val clickedProfile = identityService.getFidProfile(clickedFid, identity);
		if (clickedProfile != null) {

			if (buttonIndex == 1) {
				log.debug("Handling gift spin action: {}", validateMessage);
				var giftImage = "";

				val responseBuilder = FrameResponse.builder();
				try {
					val giftedContact = frameService.giftSpin(clickedProfile);
					giftImage = framesServiceUrl.concat(String.format("/images/profile/%s/gift" +
									"/%s/image.png",
							clickedProfile.getIdentity(), giftedContact.data().address()));
					val giftPostUrl =
							apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_GIFT,
									clickedProfile.getIdentity()));
					responseBuilder.imageUrl(giftImage)
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
					responseBuilder.imageUrl(giftImage)
							.postUrl(giftPostUrl)
							.button(BACK_FRAME_BUTTON);
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
				return FrameResponse.builder()
						.imageUrl(leaderboardImage).cacheImage(false)
						.postUrl(giftPostUrl)
						.button(BACK_FRAME_BUTTON)
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
									.map(gift -> new GiftProfileMessage.GiftMessage(ProfileMessage.convert(gift.getGifter()), gift.getToken()))
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

		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val buttonIndex = validateMessage.action().tappedButton().index();
		val clickedFid = validateMessage.action().interactor().fid();
		val clickedProfile = identityService.getFidProfile(clickedFid, identity);
		if (clickedProfile != null) {
			if (buttonIndex == 1) {

				log.debug("Handling gift back action: {}", validateMessage);

				val giftImage = framesServiceUrl.concat(String.format("/images/profile/%s/gift/image.png",
						clickedProfile.getIdentity()));
				val giftPostUrl =
						apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_GIFT,
								clickedProfile.getIdentity()));
				return FrameResponse.builder().imageUrl(giftImage)
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
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val clickedFid = validateMessage.action().interactor().fid();
		val buttonIndex = validateMessage.action().tappedButton().index();
		val input = validateMessage.action().input();
		val inputText = input != null ? input.text() : null;
		val clickedProfile = identityService.getFidProfile(clickedFid, identity);

		if (clickedProfile != null) {
			val profileImage = framesServiceUrl.concat(String.format("/images/profile/%s" +
							"/image.png",
					clickedProfile.getIdentity()));
			if (buttonIndex == 1) {
				val postUrl = apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS,
						clickedProfile.getIdentity()));
				val profileLink = dAppServiceUrl.concat(String.format("/%s",
						clickedProfile.getUsername()));

				val responseBuilder = FrameResponse.builder().imageUrl(profileImage).postUrl(postUrl)
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
			} else if (buttonIndex == 2) {
				if (!StringUtils.isBlank(inputText)) {
					// check if profile exist
					val inviteProfile = identityService.getFidProfile(inputText, identity);
					if (inviteProfile != null) {
						return FrameResponse.builder().imageUrl(profileImage)
								.button(new FrameButton(String.format("✅ %s already signed up",
										inputText), FrameButton.ActionType.POST, null)).build().toHtmlResponse();
					} else {
						// check if invited
						val inviteAddresses = identityService.getFnameAddresses(inputText);
						val invitations = contactBookService.filterByInvited(inviteAddresses);
						if (!invitations.isEmpty()) {
							return FrameResponse.builder().imageUrl(profileImage)
									.button(new FrameButton(String.format("✅ %s already invited",
											inputText), FrameButton.ActionType.POST, null)).build().toHtmlResponse();
						} else {
							// for now invite first
							val identityToInvite = identityService.getIdentitiesInfo(inviteAddresses)
									.stream().max(Comparator.comparingInt(IdentityMessage::score))
									.orElse(null);
							log.debug("Identity to invite: {} ", identityToInvite);

							if (identityToInvite != null) {
								val invitation = new Invitation(identityToInvite.address(), null);
								invitation.setInvitedBy(clickedProfile);
								invitation.setExpiryDate(new Date(System.currentTimeMillis() + TimeUnit.DAYS.toMillis(30)));
								invitationRepository.save(invitation);

								return FrameResponse.builder().imageUrl(profileImage)
										.button(new FrameButton(String.format("🎉 Successfully invited %s to Payflow",
												inputText), FrameButton.ActionType.POST, null)).build().toHtmlResponse();
							}
						}
					}
				} else {
					val postUrl = apiServiceUrl.concat(String.format(CONNECT_IDENTITY_ACTIONS_INVITE,
							clickedProfile.getIdentity()));

					return FrameResponse.builder().imageUrl(profileImage)
							.postUrl(postUrl)
							.textInput("Enter farcaster username")
							.button(BACK_FRAME_BUTTON)
							.button(new FrameButton(
									"Empty username, submit again", FrameButton.ActionType.POST, null))
							.build().toHtmlResponse();
				}
			}
		}
		return DEFAULT_HTML_RESPONSE;
	}
}
