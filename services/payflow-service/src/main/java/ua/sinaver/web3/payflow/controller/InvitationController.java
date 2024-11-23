package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.Invitation;
import ua.sinaver.web3.payflow.message.InvitationMessage;
import ua.sinaver.web3.payflow.message.ProfileMetaMessage;
import ua.sinaver.web3.payflow.message.SubmitInvitationMessage;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.service.InvitationService;
import ua.sinaver.web3.payflow.service.UserService;
import ua.sinaver.web3.payflow.service.api.IContactBookService;
import ua.sinaver.web3.payflow.service.api.IFarcasterMessagingService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;

import java.security.Principal;
import java.time.Period;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@RestController
@RequestMapping("/invitations")
@CrossOrigin(origins = "${payflow.dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
public class InvitationController {

	@Autowired
	private InvitationRepository invitationRepository;

	@Autowired
	private UserService userService;

	@Value("${payflow.invitation.whitelisted.default.users}")
	private Set<String> defaultWhitelistedUsers;

	@Value("${payflow.invitation.expiry:2w}")
	private Period invitationExpiryPeriod;

	@Autowired
	private IContactBookService contactBookService;

	@Autowired
	private IIdentityService identityService;

	@Autowired
	private IFarcasterMessagingService farcasterMessagingService;

	@Autowired
	private InvitationService invitationService;

	@GetMapping
	public List<InvitationMessage> getAll(Principal principal) {
		log.debug("Getting all invitations for {}", principal.getName());

		val user = userService.findByIdentity(principal.getName());
		if (user != null) {
			val invitedBy = ProfileMetaMessage.convert(user, false);
			return invitationRepository.findByInvitedBy(user)
					.stream()
					.sorted(this::compareInvitations)
					.map(invite -> new InvitationMessage(
							invitedBy,
							(invite.getInvitee() != null) ? ProfileMetaMessage.convert(invite.getInvitee(), false)
									: null,
							invite.getIdentity(), invite.getCode(), invite.getCreatedDate(), invite.getExpiryDate()))
					.toList();

		}
		return null;
	}

	@GetMapping("/identity/{identity}")
	@ResponseStatus(HttpStatus.OK)
	public Boolean isInvited(@PathVariable String identity) {
		return invitationService.isWhitelistedByIdentityFid(identity) ||
				!contactBookService.filterByInvited(Collections.singletonList(identity)).isEmpty();
	}

	@GetMapping("/identity")
	public Map<String, Boolean> identitiesInvited(@RequestParam(value = "identities") List<String> identities) {
		val invited = contactBookService.filterByInvited(identities);
		return identities.stream()
				.collect(Collectors.toMap(
						identity -> identity,
						identity -> invitationService.isWhitelistedByIdentityFid(identity)
								|| invited.contains(identity)));
	}

	@GetMapping("/code/{code}")
	@ResponseStatus(HttpStatus.OK)
	public Boolean isCodeValid(@PathVariable String code) {
		return invitationRepository.existsByCodeAndInviteeNull(code.toLowerCase());
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public void submitInvitation(Principal principal, @RequestBody SubmitInvitationMessage invitationMessage) {
		log.debug("Submitting invitation {} by {}", invitationMessage, principal.getName());

		if (StringUtils.isBlank(invitationMessage.identityBased())
				&& invitationMessage.codeBased() == null) {
			throw new Error("Invalid input, invitation should include either identity or code");
		}

		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			throw new Error("User doesn't exist");
		}

		val allowance = user.getUserAllowance();
		if (!StringUtils.isBlank(invitationMessage.identityBased())) {
			val invitation = new Invitation(invitationMessage.identityBased(), null);
			invitation.setInvitedBy(user);
			invitation.setExpiryDate(
					new Date(System.currentTimeMillis() + TimeUnit.DAYS.toMillis(invitationExpiryPeriod.getDays())));
			invitationRepository.save(invitation);

			val inviterUsername = identityService.getIdentityFname(user.getIdentity());
			val receiverUsername = identityService.getIdentityFname(invitation.getIdentity());
			val receiverFid = identityService.getIdentityFid(invitation.getIdentity());

			try {
				val messageText = String.format("""
								Congratulations @%s 🎉 You've been invited to @payflow by @%s
																\t
								Proceed to app.payflow.me/connect for sign up!
																\t
								`Sign In With Farcaster` is recommended for better experience 🙌🏻
																\t
								p.s. join /payflow channel for updates 👀""",
						receiverUsername,
						inviterUsername);

				val response = farcasterMessagingService.sendMessage(
						new DirectCastMessage(receiverFid, messageText, UUID.randomUUID()));

				if (StringUtils.isBlank(response.result().messageId())) {
					log.error("Failed to send direct cast with {} for invitation " +
							"completion", messageText);
				}
			} catch (Throwable t) {
				log.error("Failed to send direct cast with exception: ", t);
			}
		} else {
			val numberOfCodes = invitationMessage.codeBased().number() == null ? 1
					: invitationMessage.codeBased().number();

			if (allowance != null && allowance.getCodeInviteLimit() >= numberOfCodes) {
				allowance.setCodeInviteLimit(allowance.getCodeInviteLimit() - numberOfCodes);

				val invitations = IntStream.range(0, numberOfCodes).boxed().map(n -> {
					val code = StringUtils.isBlank(invitationMessage.codeBased().code())
							? "pf-".concat(RandomStringUtils.random(8, true, true).toLowerCase())
							: invitationMessage.codeBased().code();

					val invitation = new Invitation(null, code);
					invitation.setInvitedBy(user);
					return invitation;

				}).toList();

				invitationRepository.saveAll(invitations);
			} else {
				throw new Error("User reached his invitation limit");
			}
		}
	}

	private int compareInvitations(Invitation i1, Invitation i2) {
		if (i1.getInvitee() != null && i2.getInvitee() != null) {
			return i2.getInvitee().getCreatedDate().compareTo(i1.getInvitee().getCreatedDate());
		} else if (i1.getInvitee() != null) {
			return -1; // accepted invitations come before pending ones
		} else if (i2.getInvitee() != null) {
			return 1; // pending invitations come after accepted ones
		} else {
			return 0; // both are pending or accepted, keep their order unchanged
		}
	}
}
