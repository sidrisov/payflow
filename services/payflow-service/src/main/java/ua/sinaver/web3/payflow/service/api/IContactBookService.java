package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.entity.User;
import ua.sinaver.web3.payflow.message.ContactMessage;
import ua.sinaver.web3.payflow.message.ContactsResponseMessage;

public interface IContactBookService {
	void update(ContactMessage contactMessage, User user);

	void cleanContactsCache(User user);

	ContactsResponseMessage getAllContacts(User user);
}
