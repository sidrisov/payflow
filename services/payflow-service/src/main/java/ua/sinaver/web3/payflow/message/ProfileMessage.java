package ua.sinaver.web3.payflow.message;

import ua.sinaver.web3.payflow.data.User;

import java.util.List;

public record ProfileMessage(
		String displayName, String username,
		String profileImage, String identity,
		String signer,
		FlowMessage defaultFlow, List<FlowMessage> flows,
		int identityInviteLimit) {

	public static ProfileMessage convert(User user) {
		return new ProfileMessage(user.getDisplayName(), user.getUsername(),
				user.getProfileImage(), user.getIdentity(),
				null, null, null, -1);
	}
}
