package ua.sinaver.web3.payflow.repository;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
	@QueryHints(@QueryHint(name = AvailableSettings.JAKARTA_LOCK_TIMEOUT, value = "-2"))
	@Query("SELECT p FROM Payment p WHERE p.id = :id")
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<Payment> findWithLockById(Integer id);

	@Query("SELECT p FROM Payment p LEFT JOIN p.receiverFlow rf " +
			"WHERE p.hash IN :hashes AND " +
			"((p.receiver IS NOT NULL AND p.receiver = :senderOrReceiver) " +
			"OR (p.sender IS NOT NULL AND p.sender = :senderOrReceiver) " +
			"OR (rf IS NOT NULL AND rf.type = 'JAR'))")
	List<Payment> findByHashIn(List<String> hashes, User senderOrReceiver);

	@Query("SELECT p FROM Payment p WHERE (p.sender = :sender OR LOWER(p.senderAddress) IN :addresses) " +
			"AND p.status IN :statuses ORDER BY p.createdAt DESC")
	List<Payment> findBySenderOrSenderAddressInAndStatusInAndTypeInOrderByCreatedAtDesc(
			@Param("sender") User sender,
			@Param("addresses") List<String> addresses,
			@Param("statuses") List<Payment.PaymentStatus> statuses);

	Payment findByReferenceId(String referenceId);

	@Query("SELECT p FROM Payment p WHERE p.referenceId = :referenceId AND (p.sender IS NULL OR p.sender = :sender)")
	Payment findByReferenceIdAndSender(@Param("referenceId") String referenceId, @Param("sender") User sender);

	// JPA: UPGRADE_SKIPLOCKED - PESSIMISTIC_WRITE with a
	// javax.persistence.lock.timeout setting of -2
	// https://docs.jboss.org/hibernate/orm/5.0/userguide/html_single/chapters/locking/Locking.html
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@QueryHints(@QueryHint(name = AvailableSettings.JAKARTA_LOCK_TIMEOUT, value = "-2"))
	@Query("SELECT p FROM Payment p WHERE p.status = :status AND " +
			"((p.expiresAt IS NULL AND p.createdAt < :expiresAt) OR " +
			"(p.expiresAt IS NOT NULL AND p.expiresAt < CURRENT_TIMESTAMP))")
	Stream<Payment> findExpiredPaymentsWithLock(@Param("status") Payment.PaymentStatus status,
	                                            @Param("expiresAt") Instant expiresAt);

	// TODO: add a time check not to process recently submitted in 5 mins to avoid
	// lock
	// JPA: UPGRADE_SKIPLOCKED - PESSIMISTIC_WRITE with a
	// javax.persistence.lock.timeout setting of -2
	// https://docs.jboss.org/hibernate/orm/5.0/userguide/html_single/chapters/locking/Locking.html
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@QueryHints(@QueryHint(name = AvailableSettings.JAKARTA_LOCK_TIMEOUT, value = "-2"))
	@Query("SELECT p FROM Payment p WHERE p.status IN :statuses " +
			"AND p.createdAt <= :tenMinutesAgo " +
			"ORDER BY p.createdAt ASC")
	Stream<Payment> findTop5ByStatusInWithLock(@Param("statuses") List<Payment.PaymentStatus> statuses,
	                                           @Param("tenMinutesAgo") Instant tenMinutesAgo);

	@Query("SELECT count(p) FROM Payment p " +
			"WHERE (p.sender IN :users " +
			"OR LOWER(p.senderAddress) IN :addresses) " +
			"AND p.status = COMPLETED")
	Long findNumberOutboundCompleted(
			@Param("users") List<User> users,
			@Param("addresses") List<String> addresses);

	@Query("SELECT p FROM Payment p " +
			"WHERE (p.sender = :user OR p.receiver = :user " +
			"OR LOWER(p.senderAddress) IN :addresses " +
			"OR LOWER(p.receiverAddress) IN :addresses " +
			"OR (p.receiverFid IS NOT NULL AND p.receiverFid = :fid)) " +
			"AND p.status = COMPLETED ORDER BY p.completedAt DESC")
	Page<Payment> findAllCompletedOrderByCompletedAtDesc(
			User user,
			List<String> addresses,
			Integer fid,
			Pageable pageable);

	@Query("SELECT p FROM Payment p " +
			"WHERE (p.sender = :user OR LOWER(p.senderAddress) IN :addresses) " +
			"AND p.status IN :statuses " +
			"ORDER BY CASE WHEN p.completedAt IS NOT NULL " +
			"THEN p.completedAt ELSE p.createdAt END DESC")
	Page<Payment> findOutboundByStatusAndSenderOrderDesc(
			@Param("user") User user,
			@Param("addresses") List<String> addresses,
			@Param("statuses") List<Payment.PaymentStatus> statuses,
			Pageable pageable);

	@Query("SELECT COUNT(p) FROM Payment p WHERE p.status IN ('COMPLETED', 'REFUNDED', 'CANCELLED')")
	Long countAllCompletedPayments();

	@Query("SELECT COUNT(p) FROM Payment p WHERE p.status = 'COMPLETED' AND " +
			"(p.category is NULL OR p.category IN :categories)")
	Long countCompletedPaymentsByCategories(@Param("categories") List<String> categories);

	@Query("SELECT COALESCE(ROUND(SUM(CASE " +
			"WHEN p.tokenAmount IS NULL THEN 1 " +
			"WHEN p.tokenAmount LIKE '%.%' AND p.tokenAmount NOT LIKE '%[^0-9.]%' THEN CAST(p.tokenAmount AS double) " +
			"WHEN p.tokenAmount LIKE '%[^0-9]%' THEN 1 " +
			"ELSE CAST(p.tokenAmount AS double) END)), 0) " +
			"FROM Payment p WHERE p.category = :category AND p.status = 'COMPLETED'")
	Long countPurchasedAmountByCategory(@Param("category") String category);

	default Stream<Payment> findTop5ByStatusInWithLock(@Param("statuses") List<Payment.PaymentStatus> statuses) {
		return findTop5ByStatusInWithLock(statuses, Instant.now().minus(10, ChronoUnit.MINUTES));
	}

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@QueryHints(@QueryHint(name = AvailableSettings.JAKARTA_LOCK_TIMEOUT, value = "-2"))
	@Query("SELECT p FROM Payment p WHERE p.status IN :statuses " +
			"AND p.type IN :types " +
			"ORDER BY p.createdAt ASC LIMIT :limit")
	Stream<Payment> findSessionPaymentsWithLock(
			@Param("statuses") List<Payment.PaymentStatus> statuses,
			@Param("types") List<Payment.PaymentType> types,
			@Param("limit") int limit);

	default Stream<Payment> findSessionIntentPaymentsWithLock(int limit) {
		return findSessionPaymentsWithLock(
				List.of(Payment.PaymentStatus.CREATED),
				List.of(Payment.PaymentType.SESSION_INTENT),
				limit);
	}
}
