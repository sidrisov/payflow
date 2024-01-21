package ua.sinaver.web3.payflow.message;

import ua.sinaver.web3.payflow.data.Contact;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.graphql.generated.types.Wallet;

public record ContactMessage(
		String identity, Boolean favouriteProfile, Boolean favouriteAddress,
		ProfileMessage profile,
		Wallet socialMetadata) {

	public static ContactMessage convert(Contact contact, User profile, Wallet socialMetadata) {
		ProfileMessage profileMessage = null;
		if (profile != null) {
			profileMessage = new ProfileMessage(profile.getDisplayName(),
					profile.getUsername(),
					profile.getProfileImage(),
					profile.getIdentity(),
					null,
					FlowMessage.convert(profile.getDefaultFlow(), profile),
					null,
					-1);
		}

		return new ContactMessage(contact.getIdentity(), contact.isProfileChecked(),
				contact.isAddressChecked(), profileMessage, socialMetadata);
	}
}
