package ua.sinaver.web3.payflow.message;

import lombok.val;
import ua.sinaver.web3.payflow.dto.FlowMessage;
import ua.sinaver.web3.payflow.dto.ProfileMessage;
import ua.sinaver.web3.payflow.entity.Contact;
import ua.sinaver.web3.payflow.entity.PreferredTokens;
import ua.sinaver.web3.payflow.entity.User;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

public record ContactMessage(
		IdentityMessage data,
		List<String> tags) {

	public static ProfileMessage convert(User profile) {
		if (profile != null && profile.isAllowed()) {
			// TODO, move to utils
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

	public static ContactMessage convert(Contact contact, SocialMetadata socialMetadata, List<String> tags) {
		val data = IdentityMessage.convert(contact.getIdentity(), contact.getProfile(), socialMetadata);
		return new ContactMessage(data, tags);
	}

	public static ContactMessage convert(String identity, User profile, SocialMetadata socials,
			List<String> tags) {
		val data = IdentityMessage.convert(identity, profile, socials);
		return new ContactMessage(data, tags);
	}
}
