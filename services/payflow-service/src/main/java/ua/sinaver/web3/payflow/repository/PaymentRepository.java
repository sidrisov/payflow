package ua.sinaver.web3.payflow.repository;

import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.payflow.data.Payment;

import java.util.List;

public interface PaymentRepository extends CrudRepository<Payment, Integer> {
	List<Payment> findByHashIn(List<String> hashes);

	Payment findByReferenceId(String referenceId);
}
