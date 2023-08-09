package ua.sinaver.web3.repository;

import ua.sinaver.web3.data.PaymentRequest;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

public interface PaymentRequestRepository extends CrudRepository<PaymentRequest, Integer> {
    List<PaymentRequest> findByUserId(Integer userId);

    PaymentRequest findByUuid(String uuid);
}
