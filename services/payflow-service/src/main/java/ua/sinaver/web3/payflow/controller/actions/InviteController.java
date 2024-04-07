package ua.sinaver.web3.payflow.controller.actions;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.sinaver.web3.payflow.data.Invitation;
import ua.sinaver.web3.payflow.message.FrameMessage;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.api.IContactBookService;
import ua.sinaver.web3.payflow.service.api.IFarcasterHubService;
import ua.sinaver.web3.payflow.service.api.IFrameService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.util.Comparator;
import java.util.Date;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/farcaster/actions/invite")
@Transactional
@Slf4j
public class InviteController {

	@Autowired
	private IFarcasterHubService farcasterHubService;

	@Autowired
	private IFrameService frameService;

	@Autowired
	private IContactBookService contactBookService;

	@Autowired
	private IdentityService identityService;

	@Autowired
	private InvitationRepository invitationRepository;

	@PostMapping
	public ResponseEntity<FrameResponse.FrameError> invite(@RequestBody FrameMessage castActionMessage) {
		log.debug("Received cast action: invite {}", castActionMessage);
		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				castActionMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameError("Cast action not verified!"));
		}

		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val clickedFid = validateMessage.action().interactor().fid();
		val casterFid = validateMessage.action().cast().fid();


		val clickedProfile = frameService.getFidProfiles(clickedFid).stream().findFirst().orElse(null);
		if (clickedProfile == null) {
			log.error("Clicked fid {} is not on payflow", clickedFid);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameError("Sign up on Payflow first!"));
		}

		// check if profile exist
		val inviteProfiles = frameService.getFidProfiles(casterFid);
		if (!inviteProfiles.isEmpty()) {
			return ResponseEntity.ok().body(
					new FrameResponse.FrameError("Already signed up on Payflow!"));
		} else {
			// check if invited
			val inviteAddresses = frameService.getFidAddresses(casterFid);
			val invitations = contactBookService.filterByInvited(inviteAddresses);
			if (!invitations.isEmpty()) {
				return ResponseEntity.ok().body(
						new FrameResponse.FrameError("Already invited to Payflow!"));
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

					// todo: add bot command to notify user he was invited

					return ResponseEntity.ok().body(
							new FrameResponse.FrameError("Invited to Payflow!"));
				} else {
					return ResponseEntity.internalServerError().body(
							new FrameResponse.FrameError("Oops, something went wrong!"));
				}
			}
		}
	}
}
