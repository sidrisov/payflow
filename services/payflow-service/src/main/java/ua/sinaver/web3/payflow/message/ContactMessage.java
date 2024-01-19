package ua.sinaver.web3.payflow.message;

import lombok.val;
import ua.sinaver.web3.payflow.data.Contact;
import ua.sinaver.web3.payflow.data.User;

public record ContactMessage(
		String identity, Boolean profileChecked, Boolean addressChecked) {

	public static ContactMessage convert(Contact contact) {
		return new ContactMessage(contact.getIdentity(), contact.isProfileChecked(),
				contact.isAddressChecked());
	}

	public static Contact convert(ContactMessage contactMessage, User user) {
		val contact = new Contact(user, contactMessage.identity());
		if (contactMessage.addressChecked != null) {
			contact.setAddressChecked(contactMessage.addressChecked);
		}

		if (contactMessage.profileChecked != null) {
			contact.setProfileChecked(contactMessage.profileChecked);
		}
		return contact;
	}

}
