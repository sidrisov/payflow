package ua.sinaver.web3.payflow.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;

import java.util.List;

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

	Payment findByReferenceId(String referenceId);

	Payment findByReferenceIdAndSender(String referenceId, User sender);

}
