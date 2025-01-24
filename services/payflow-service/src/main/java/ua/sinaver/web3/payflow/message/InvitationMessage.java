package ua.sinaver.web3.payflow.message;

import ua.sinaver.web3.payflow.dto.ProfileMetaMessage;

import java.util.Date;

public record InvitationMessage(ProfileMetaMessage invitedBy, ProfileMetaMessage invitee,
                                String identity, String code,
                                Date createdDate,
                                Date expiryDate) {
}
