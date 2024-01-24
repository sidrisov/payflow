package ua.sinaver.web3.payflow.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.payflow.data.Contact;
import ua.sinaver.web3.payflow.data.User;

import java.util.List;

public interface ContactRepository extends CrudRepository<Contact, Integer> {

	@Query("SELECT c FROM Contact c WHERE c.user = :user " +
			"ORDER BY (CASE WHEN c.profileChecked THEN 1 WHEN c.addressChecked " +
			"THEN 2 ELSE 3 END)")
	List<Contact> findAllByUser(User user);

	@Query("SELECT c.identity FROM Contact c WHERE c.user = :user")
	List<String> findAllIdentitiesByUser(User user);

	Contact findByUserAndIdentity(
			User user,
			String identity);

/*	@Query("SELECT " +
			"SUM(CASE WHEN c.favouriteAddress IS TRUE THEN 1 ELSE 0 END + " +
			"CASE WHEN c.favouriteProfile IS TRUE THEN 1 ELSE 0 END) " +
			"FROM Contact c " +
			"WHERE c.user = :user AND (c.favouriteAddress IS TRUE OR c.favouriteProfile IS TRUE)")
	int findTotalFavouriteCountByUser(User user);*/
}
