package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.entity.Invitation;
import ua.sinaver.web3.payflow.message.InvitationMessage;
import ua.sinaver.web3.payflow.dto.ProfileMetaMessage;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.service.InvitationService;
import ua.sinaver.web3.payflow.service.UserService;

import java.security.Principal;
import java.util.*;

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
		return invitationService.isWhitelistedByIdentityFid(identity);
	}

	@GetMapping("/code/{code}")
	@ResponseStatus(HttpStatus.OK)
	public Boolean isCodeValid(@PathVariable String code) {
		return invitationRepository.existsByCodeAndInviteeNull(code.toLowerCase());
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
