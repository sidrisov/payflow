package ua.sinaver.web3.payflow.repository;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.WalletProfileRequestMessage;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public interface UserRepository extends CrudRepository<User, Integer> {
	User findByIdentity(String identity);

	User findByAccessToken(String accessToken);

	Stream<User> findByIdentityIn(List<String> identities);

	default Map<String, User> findByIdentityAsMapIn(List<String> identities) {
		return findByIdentityIn(identities)
				.collect(Collectors.toMap(User::getIdentity, Function.identity()));
	}

	User findByIdentityAndAllowedTrue(String identity);

	User findByUsernameOrIdentity(String username, String identity);

	default User findByUsernameOrIdentity(String usernameOrIdentity) {
		return findByUsernameOrIdentity(usernameOrIdentity, usernameOrIdentity);
	}

	@Query("SELECT u FROM User u WHERE u.displayName LIKE %:query% OR u.username LIKE %:query% OR u.identity LIKE %:query%")
	List<User> findBySearchQuery(@Param("query") String searchQuery);

	@Query(value = "SELECT * FROM user WHERE id " +
			"in (SELECT user_id FROM flow WHERE id " +
			"in (SELECT flow_id FROM wallet WHERE " +
			"address = :#{#wallet.address} AND network = :#{#wallet.network}))", nativeQuery = true)
	User findByOwnedWallet(@Param("wallet") WalletProfileRequestMessage wallet);

	List<User> findByAllowedTrueOrderByLastSeenDesc();

	// TODO: index: allowed, lastSeen, lastUpdatedContacts
	// JPA: UPGRADE_SKIPLOCKED - PESSIMISTIC_WRITE with a
	// javax.persistence.lock.timeout setting of -2
	// https://docs.jboss.org/hibernate/orm/5.0/userguide/html_single/chapters/locking/Locking.html
	@QueryHints(@QueryHint(name = AvailableSettings.JAKARTA_LOCK_TIMEOUT, value = "-2"))
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query(value = "SELECT u FROM User u WHERE u.allowed = true AND u.lastSeen > :lastSeenDate AND " +
			"(u.lastUpdatedContacts < :updateDate" +
			" OR u.lastUpdatedContacts IS NULL)")
	Page<User> findByAllowedTrueAndLastUpdatedContactsBeforeAndLastSeenAfter(Date updateDate,
	                                                                         Date lastSeenDate,
	                                                                         Pageable pageable);

	default List<User> findTop5ByAllowedTrueAndLastUpdatedContactsBeforeAndLastSeenAfter(Date updateDate,
	                                                                                     Date lastSeenDate) {
		return this.findByAllowedTrueAndLastUpdatedContactsBeforeAndLastSeenAfter(updateDate,
				lastSeenDate, PageRequest.of(0, 5)).getContent();
	}

}
