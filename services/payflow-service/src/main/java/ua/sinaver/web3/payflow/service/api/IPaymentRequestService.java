package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.PaymentRequestMessage;

import java.util.List;

public interface IPaymentRequestService {
	void saveRequest(User user, PaymentRequestMessage requestMessage) throws Exception;

	List<PaymentRequestMessage> getAllRequests(User user);

	PaymentRequestMessage findByUUID(String uuid);

	void addProof(String uuid, String proof) throws Exception;

	void acceptPayment(User user, String uuid) throws Exception;
}
