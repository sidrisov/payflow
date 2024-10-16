package ua.sinaver.web3.payflow.repository;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;

import java.util.Date;
import java.util.List;
import java.util.stream.Stream;

public interface PaymentRepository extends CrudRepository<Payment, Integer> {
	@Query("SELECT p FROM Payment p LEFT JOIN p.receiverFlow rf " +
			"WHERE p.hash IN :hashes AND " +
			"((p.receiver IS NOT NULL AND p.receiver = :senderOrReceiver) " +
			"OR (p.sender IS NOT NULL AND p.sender = :senderOrReceiver) " +
			"OR (rf IS NOT NULL AND rf.type = 'JAR'))")
	List<Payment> findByHashIn(List<String> hashes, User senderOrReceiver);

	@Query("SELECT p FROM Payment p WHERE (p.sender = :sender OR LOWER(p.senderAddress) IN :addresses) " +
			"AND p.status IN :statuses ORDER BY p.createdDate DESC")
	List<Payment> findBySenderOrSenderAddressInAndStatusInAndTypeInOrderByCreatedDateDesc(
			@Param("sender") User sender,
			@Param("addresses") List<String> addresses,
			@Param("statuses") List<Payment.PaymentStatus> statuses);

	Payment findByReferenceId(String referenceId);

	Payment findByReferenceIdAndSender(String referenceId, User sender);

	// JPA: UPGRADE_SKIPLOCKED - PESSIMISTIC_WRITE with a
	// javax.persistence.lock.timeout setting of -2
	// https://docs.jboss.org/hibernate/orm/5.0/userguide/html_single/chapters/locking/Locking.html
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@QueryHints(@QueryHint(name = AvailableSettings.JAKARTA_LOCK_TIMEOUT, value = "-2"))
	@Query("SELECT p FROM Payment p WHERE p.status = :status AND p.createdDate < :date")
	Stream<Payment> findOldPendingPaymentsWithLock(@Param("status") Payment.PaymentStatus status,
			@Param("date") Date date);

	// JPA: UPGRADE_SKIPLOCKED - PESSIMISTIC_WRITE with a
	// javax.persistence.lock.timeout setting of -2
	// https://docs.jboss.org/hibernate/orm/5.0/userguide/html_single/chapters/locking/Locking.html
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@QueryHints(@QueryHint(name = AvailableSettings.JAKARTA_LOCK_TIMEOUT, value = "-2"))
	@Query("SELECT p FROM Payment p WHERE p.status IN :statuses")
	Stream<Payment> findTop5ByStatusInWithLock(@Param("statuses") List<Payment.PaymentStatus> statuses);

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
			"OR LOWER(p.receiverAddress) IN :addresses) " +
			"AND p.status = COMPLETED ORDER BY p.completedDate DESC")
	Page<Payment> findAllCompletedOrderByCompletedDateDesc(
			@Param("user") User user,
			@Param("addresses") List<String> addresses,
			Pageable pageable);

	@Query("SELECT p FROM Payment p " +
			"WHERE (p.sender = :user OR LOWER(p.senderAddress) IN :addresses) " +
			"AND p.status IN :statuses " +
			"ORDER BY CASE WHEN p.completedDate IS NOT NULL " +
			"THEN p.completedDate ELSE p.createdDate END DESC")
	Page<Payment> findOutboundByStatusAndSenderOrderDesc(
			@Param("user") User user,
			@Param("addresses") List<String> addresses,
			@Param("statuses") List<Payment.PaymentStatus> statuses,
			Pageable pageable);
}
