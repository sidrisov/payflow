package ua.sinaver.web3.payflow.message;

import java.util.Date;

public record InvitationMessage(ProfileMetaMessage invitedBy, ProfileMetaMessage invitee,
                                String identity, String code,
                                Date createdDate,
                                Date expiryDate) {
}
