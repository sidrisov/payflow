package ua.sinaver.web3.payflow.message;

import ua.sinaver.web3.payflow.data.User;

public record ProfileMetaMessage(String identity, String displayName, String username,
                                 String profileImage,
                                 String createdDate, FlowMessage defaultFlow) {

	public static ProfileMetaMessage convert(User user, boolean includeFlow) {
		return new ProfileMetaMessage(user.getIdentity(), user.getDisplayName(),
				user.getUsername(),
				user.getProfileImage(), user.getCreatedDate().toString(), includeFlow ?
				// don't include signer flow info
				FlowMessage.convertDefaultFlow(user, false) : null);
	}
}
