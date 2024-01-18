package ua.sinaver.web3.repository;

import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.data.Contact;
import ua.sinaver.web3.data.User;

import java.util.List;

public interface ContactRepository extends CrudRepository<Contact, Integer> {

	default List<Contact> findAllByUser(User user) {
		return findAllByUserAndProfileCheckedTrueOrUserAndAddressCheckedTrue(user, user);
	}

	List<Contact> findAllByUserAndProfileCheckedTrueOrUserAndAddressCheckedTrue(User user1, User user2);

	Contact findByUserAndIdentity(
			User user,
			String identity);
}
