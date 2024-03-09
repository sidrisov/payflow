package ua.sinaver.web3.payflow.repository;

import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;

import java.util.List;

public interface PaymentRepository extends CrudRepository<Payment, Integer> {
	List<Payment> findByHashInAndReceiver(List<String> hashes, User receiver);

	List<Payment> findBySenderAndStatusAndTypeIn(User sender,
	                                             Payment.PaymentStatus status,
	                                             List<Payment.PaymentType> types);

	Payment findByReferenceId(String referenceId);
}
