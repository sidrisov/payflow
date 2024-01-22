package ua.sinaver.web3.payflow.repository;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.WalletProfileRequestMessage;

import java.util.Date;
import java.util.List;

public interface UserRepository extends CrudRepository<User, Integer> {
	User findByIdentity(String identity);

	User findByUsernameOrIdentity(String username, String identity);

	default User findByUsernameOrIdentity(String usernameOrIdentity) {
		return findByUsernameOrIdentity(usernameOrIdentity, usernameOrIdentity);
	}

	List<User> findByDisplayNameContainingOrUsernameContainingOrIdentityContaining(String displayName,
	                                                                               String username,
	                                                                               String identity);

	@Query(value = "SELECT * FROM user WHERE id " +
			"in (SELECT user_id FROM flow WHERE id " +
			"in (SELECT flow_id FROM wallet WHERE " +
			"address = :#{#wallet.address} AND network = :#{#wallet.network}))", nativeQuery = true)
	User findByOwnedWallet(@Param("wallet") WalletProfileRequestMessage wallet);

	List<User> findByAllowedTrueOrderByLastSeenDesc();

	// TODO: index: allowed, lastSeen, lastUpdatedContacts
	@Query("SELECT u FROM User u WHERE u.allowed = true AND u.lastSeen > :lastSeenDate AND " +
			"(u.lastUpdatedContacts < :updateDate" +
			" OR u.lastUpdatedContacts IS NULL)")
	List<User> findByAllowedTrueAndLastUpdatedContactsBeforeAndLastSeenAfter(Date updateDate,
	                                                                         Date lastSeenDate);
}
