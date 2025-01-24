package ua.sinaver.web3.payflow.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.payflow.entity.Contact;
import ua.sinaver.web3.payflow.entity.User;

import java.util.List;

public interface ContactRepository extends CrudRepository<Contact, Integer> {

	List<Contact> findAllByUser(User user);

	List<Contact> findByUserAndProfileCheckedTrue(User user);

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
