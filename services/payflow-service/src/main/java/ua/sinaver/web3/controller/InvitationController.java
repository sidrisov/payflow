package ua.sinaver.web3.controller;

import java.security.Principal;
import java.util.List;
import java.util.Set;
import java.util.stream.IntStream;

import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    @Value("${payflow.invitation.whitelisted.default.users}")
    private Set<String> defaultWhitelistedUsers;

    // TODO: add converter to messages
    @GetMapping
    public List<InvitationMessage> getAll(Principal principal) {
        log.debug("Getting all invitations for {}", principal.getName());

        val user = userService.findBySigner(principal.getName());
        if (user != null) {
            val invitedBy = new ProfileMetaMessage(user.getSigner(), user.getDisplayName(), user.getUsername(),
                    user.getProfileImage(), user.getCreatedDate().toString());

            val invitations = invitationRepository.findByInvitedBy(user);
            val invitationMessages = invitations.stream()
                    .map(invite -> new InvitationMessage(
                            invitedBy,
                            invite.getInvitee() != null
                                    ? new ProfileMetaMessage(invite.getInvitee().getSigner(),
                                            invite.getInvitee().getDisplayName(),
                                            invite.getInvitee().getUsername(),
                                            invite.getInvitee().getProfileImage(),
                                            invite.getInvitee().getCreatedDate().toString())
                                    : null,
                            invite.getIdentity(), invite.getCode(), invite.getCreatedDate(), invite.getExpiryDate()))
                    .toList();

            return invitationMessages;

        }

        return null;

    }

    @GetMapping("/identity/{identity}")
    @ResponseStatus(HttpStatus.OK)
    public Boolean isInvited(@PathVariable String identity) {
        return invitationRepository.existsByIdentityAndInviteeNull(identity)
                || defaultWhitelistedUsers.contains(identity);
    }

    @GetMapping("/code/{code}")
    @ResponseStatus(HttpStatus.OK)
    public Boolean isCodeValid(@PathVariable String code) {
        return invitationRepository.existsByCodeAndInviteeNull(code);
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

        val allowance = user.getInvitationAllowance();

        if (!StringUtils.isBlank(invitationMessage.identityBased())) {
            if (allowance != null && allowance.getIdenityInviteLimit() > 0) {
                allowance.setIdenityInviteLimit(allowance.getIdenityInviteLimit() - 1);
                val invitation = new Invitation(invitationMessage.identityBased(), null);
                invitation.setInvitedBy(user);
                invitationRepository.save(invitation);
            } else {
                throw new Error("User reached his invitation limit");
            }
        } else {
            val numberOfCodes = invitationMessage.codeBased().number() == null ? 1
                    : invitationMessage.codeBased().number().intValue();

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

}
