package ua.sinaver.web3.payflow.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.payflow.data.Contact;
import ua.sinaver.web3.payflow.data.User;

import java.util.List;

public interface ContactRepository extends CrudRepository<Contact, Integer> {

	List<Contact> findAllByUser(User user);

	@Query("SELECT c.identity FROM Contact c WHERE c.user = :user")
	List<String> findAllIdentitiesByUser(User user);

	Contact findByUserAndIdentity(
			User user,
			String identity);
}
