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

	@Query("SELECT " +
			"SUM(CASE WHEN c.addressChecked IS TRUE THEN 1 ELSE 0 END + " +
			"CASE WHEN c.profileChecked IS TRUE THEN 1 ELSE 0 END) " +
			"FROM Contact c " +
			"WHERE c.user = :user AND (c.addressChecked IS TRUE OR c.profileChecked IS TRUE)")
	int findTotalFavouriteCountByUser(User user);
}
