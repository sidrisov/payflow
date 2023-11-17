package ua.sinaver.web3.controller;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.transaction.Transactional;
import lombok.val;
import lombok.extern.slf4j.Slf4j;
import ua.sinaver.web3.data.Invitation;
import ua.sinaver.web3.message.InvitationMessage;
import ua.sinaver.web3.message.ProfileMetaMessage;
import ua.sinaver.web3.message.SubmitInvitationMessage;
import ua.sinaver.web3.repository.InvitationRepository;
import ua.sinaver.web3.service.UserService;

@RestController
@RequestMapping("/invitations")
@CrossOrigin(origins = "${dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
public class InvitationController {

    @Autowired
    private InvitationRepository invitationRepository;

    @Autowired
    private UserService userService;

    @GetMapping
    public List<InvitationMessage> getAll(Principal principal) {
        log.debug("Getting all invitations for {}", principal.getName());

        val user = userService.findBySigner(principal.getName());
        if (user != null) {
            val invitations = invitationRepository.findByInvitedBy(user);
            val invitationMessages = invitations.stream()
                    .map(invite -> new InvitationMessage(
                            new ProfileMetaMessage(user.getSigner(), user.getDisplayName(), user.getUsername(),
                                    user.getProfileImage()),
                            invite.getInvitee() != null
                                    ? new ProfileMetaMessage(invite.getInvitee().getSigner(),
                                            invite.getInvitee().getDisplayName(),
                                            invite.getInvitee().getUsername(),
                                            invite.getInvitee().getProfileImage())
                                    : null,
                            invite.getIdentity(), invite.getCode(), invite.getCreatedDate(), invite.getExpiryDate()))
                    .toList();

            return invitationMessages;

        }

        return null;

    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void submitInvitation(Principal principal, @RequestBody SubmitInvitationMessage invitationMessage) {
        log.debug("Submitting invitation {} by {}", invitationMessage, principal.getName());

        if (StringUtils.isBlank(invitationMessage.identityBased())
                && invitationMessage.codeBased() == null) {
            throw new Error("Invalid input, invitation should include either identity or code");
        }

        val user = userService.findBySigner(principal.getName());
        if (user == null) {
            throw new Error("User doesn't exist");
        }

        if (!StringUtils.isBlank(invitationMessage.identityBased())) {
            val invitation = new Invitation(invitationMessage.identityBased(), null);
            invitation.setInvitedBy(user);
            invitationRepository.save(invitation);
        } else {
            val numberOfCodes = invitationMessage.codeBased().number() == null ? 1
                    : invitationMessage.codeBased().number().intValue();

            val invitations = IntStream.range(0, numberOfCodes).boxed().map(n -> {
                val code = StringUtils.isBlank(invitationMessage.codeBased().code())
                        ? "pf-".concat(RandomStringUtils.random(8, true, true).toLowerCase())
                        : invitationMessage.codeBased().code();

                val invitation = new Invitation(null, code);
                invitation.setInvitedBy(user);
                return invitation;

            }).toList();

            invitationRepository.saveAll(invitations);
        }
    }

}
