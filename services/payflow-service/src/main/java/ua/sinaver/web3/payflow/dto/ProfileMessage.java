package ua.sinaver.web3.payflow.dto;

import lombok.val;
import ua.sinaver.web3.payflow.entity.PreferredTokens;
import ua.sinaver.web3.payflow.entity.User;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

public record ProfileMessage(
		String displayName, String username,
		String profileImage, String identity,
		String signer,
		FlowMessage defaultFlow, List<FlowMessage> flows,
		int identityInviteLimit,
		List<String> preferredTokens,
		User.FarcasterClient preferredFarcasterClient,
		boolean earlyFeatureAccess,
		boolean proFeatureAccess) {

	public static ProfileMessage convert(User user) {
		val preferredTokens = Optional.ofNullable(user.getPreferredTokens())
				.map(PreferredTokens::getTokenList)
				.orElse(Collections.emptyList());
		return new ProfileMessage(user.getDisplayName(), user.getUsername(),
				user.getProfileImage(), user.getIdentity(),
				null, null, null, -1,
				preferredTokens,
				user.getPreferredFarcasterClient(), false,
				false);
	}
}
