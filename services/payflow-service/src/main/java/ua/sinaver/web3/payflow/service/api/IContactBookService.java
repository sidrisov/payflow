package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.ContactMessage;
import ua.sinaver.web3.payflow.message.ContactsResponseMessage;

import java.util.List;

public interface IContactBookService {
	void update(ContactMessage contactMessage, User user);

	void cleanContactsCache(User user);

	ContactsResponseMessage getAllContacts(User user);

	List<String> filterByInvited(List<String> addresses);
}
