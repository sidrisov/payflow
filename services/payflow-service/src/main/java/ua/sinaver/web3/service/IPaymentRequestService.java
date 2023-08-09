package ua.sinaver.web3.service;

import java.util.List;

import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.PaymentRequestMessage;

public interface IPaymentRequestService {
    void saveRequest(User user, PaymentRequestMessage requestMessage) throws Exception;

    List<PaymentRequestMessage> getAllRequests(User user);

    PaymentRequestMessage findByUUID(String uuid);

    void addProof(String uuid, String proof) throws Exception;

    void acceptPayment(User user, String uuid) throws Exception;
}
