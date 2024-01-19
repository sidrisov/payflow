package ua.sinaver.web3.payflow.service;

import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.graphql.generated.types.Wallet;
import ua.sinaver.web3.payflow.message.ContactMessage;

import java.util.List;

public interface IContactBookService {
	List<String> getAllFollowingContacts(String identity);

	Wallet getSocialMetadata(String identity, String me);

	void update(ContactMessage contactMessage, User user);

	List<ContactMessage> getAllContacts(User user);
}
