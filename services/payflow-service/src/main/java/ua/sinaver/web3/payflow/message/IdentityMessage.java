package ua.sinaver.web3.payflow.message;

import lombok.val;
import ua.sinaver.web3.payflow.dto.FlowMessage;
import ua.sinaver.web3.payflow.dto.ProfileMessage;
import ua.sinaver.web3.payflow.entity.PreferredTokens;
import ua.sinaver.web3.payflow.entity.User;

import java.util.Collections;
import java.util.Optional;

public record IdentityMessage(
		String address,
		ProfileMessage profile,
		SocialMetadata meta) {

	private static final int PAYFLOW_SCORE = 10;
	private static final int ENS_SCORE = 5;
	private static final int FARCASTER_SCORE = 4;

	public static ProfileMessage convert(User profile) {
		if (profile != null && profile.isAllowed()) {
			val preferredTokens = Optional.ofNullable(profile.getPreferredTokens())
					.map(PreferredTokens::getTokenList)
					.orElse(Collections.emptyList());
			return new ProfileMessage(profile.getDisplayName(),
					profile.getUsername(),
					profile.getProfileImage(),
					profile.getIdentity(),
					null,
					FlowMessage.convertDefaultFlow(profile, false),
					null,
					preferredTokens, null, false, false);
		} else {
			return null;
		}
	}

	public static IdentityMessage convert(String identity, User profile, SocialMetadata meta) {
		val profileMessage = convert(profile);

		return new IdentityMessage(identity, profileMessage, meta);
	}

	public int score() {
		var score = 0;
		if (this.profile != null) {
			score += PAYFLOW_SCORE;
		}

		val meta = this.meta();
		if (meta != null) {
			if (meta.ens() != null) {
				score += ENS_SCORE;
			}

			if (meta.socials() != null) {
				for (val s : meta.socials()) {
					if (s.dappName().equals("farcaster")) {
						score += FARCASTER_SCORE;
					}
				}
			}
		}
		return score;
	}
}
