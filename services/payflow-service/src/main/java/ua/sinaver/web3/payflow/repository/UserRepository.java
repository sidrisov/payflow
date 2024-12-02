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
import ua.sinaver.web3.payflow.data.Flow;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.WalletProfileRequestMessage;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

public interface UserRepository extends CrudRepository<User, Integer> {

	boolean existsByUsername(String username);

	User findByIdentityIgnoreCase(String identity);

	User findByAccessToken(String accessToken);

	User findByIdentityIgnoreCaseAndAllowedTrue(String identity);

	User findByUsernameOrIdentityIgnoreCase(String username, String identity);

	default User findByUsernameOrIdentityIgnoreCase(String usernameOrIdentity) {
		return findByUsernameOrIdentityIgnoreCase(usernameOrIdentity, usernameOrIdentity);
	}

	@Query("SELECT u FROM User u WHERE LOWER(u.displayName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.identity) LIKE LOWER(CONCAT('%', :query, '%'))")
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

	@Query("SELECT DISTINCT f FROM User u " +
			"JOIN u.flows f " +
			"JOIN f.wallets w " +
			"WHERE f.disabled = false " +
			"AND f.archived = false " +
			"AND w.walletVersion = :walletVersion")
	List<Flow> findUsersWithNonDisabledFlowAndWalletVersion(@Param("walletVersion") String walletVersion);

	@Query("SELECT COUNT(DISTINCT u) FROM User u WHERE u.lastSeen >= :startDate")
	long countActiveUsersSince(@Param("startDate") Date startDate);

	default long countDailyActiveUsers() {
		return countActiveUsersSince(Date.from(Instant.now().minus(1, ChronoUnit.DAYS)));
	}

	default long countWeeklyActiveUsers() {
		return countActiveUsersSince(Date.from(Instant.now().minus(7, ChronoUnit.DAYS)));
	}

	default long countMonthlyActiveUsers() {
		return countActiveUsersSince(Date.from(Instant.now().minus(30, ChronoUnit.DAYS)));
	}

	List<User> findByCreatedDateAfter(Instant createdAfter);
}
