package ua.sinaver.web3.service;

import ua.sinaver.web3.data.User;
import ua.sinaver.web3.graphql.generated.types.Wallet;
import ua.sinaver.web3.message.ContactMessage;

import java.util.List;

public interface IContactBookService {
	List<String> getAllFollowingContacts(String identity);

	Wallet getSocialMetadata(String identity, String me);

	void update(ContactMessage contactMessage, User user);

	List<ContactMessage> getAllContacts(User user);
}
