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
			"AND p.status IN :statuses AND p.type IN :types ORDER BY p.createdDate DESC")
	List<Payment> findBySenderOrSenderAddressInAndStatusInAndTypeInOrderByCreatedDateDesc(
			@Param("sender") User sender,
			@Param("addresses") List<String> addresses,
			@Param("statuses") List<Payment.PaymentStatus> statuses,
			@Param("types") List<Payment.PaymentType> types);

	@Query("SELECT p FROM Payment p WHERE p.status = COMPLETED  " +
			"AND(p.sender = :user OR p.receiver = :user " +
			"OR LOWER(p.senderAddress) IN :addresses " +
			"OR LOWER(p.receiverAddress) IN :addresses) " +
			"ORDER BY p.createdDate DESC")
	List<Payment> findCompletedOrderByCompletedDateDesc(
			@Param("user") User user,
			@Param("addresses") List<String> addresses);

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

	@Query("SELECT p FROM Payment p " +
			"WHERE (p.sender = :user OR p.receiver = :user " +
			"OR LOWER(p.senderAddress) IN :addresses " +
			"OR LOWER(p.receiverAddress) IN :addresses) " +
			"AND p.status = COMPLETED ORDER BY p.completedDate DESC")
	Page<Payment> findCompletedOrderByCompletedDateDesc(
			@Param("user") User user,
			@Param("addresses") List<String> addresses,
			Pageable pageable);
}
