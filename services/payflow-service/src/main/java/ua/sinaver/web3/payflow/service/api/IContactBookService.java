package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.ContactMessage;

import java.util.List;

public interface IContactBookService {
	void update(ContactMessage contactMessage, User user);

	List<ContactMessage> getAllContacts(User user);

	// run only once
	List<ContactMessage> getEthDenverParticipants(User user);

	List<String> filterByInvited(List<String> addresses);
}
