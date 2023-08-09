package ua.sinaver.web3.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.val;
import lombok.extern.slf4j.Slf4j;
import ua.sinaver.web3.data.Flow;
import ua.sinaver.web3.data.PaymentRequest;
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.FlowMessage;
import ua.sinaver.web3.message.PaymentRequestMessage;
import ua.sinaver.web3.repository.FlowRepository;
import ua.sinaver.web3.repository.PaymentRequestRepository;
import ua.sinaver.web3.repository.UserRepository;

@Slf4j
@Service
@Transactional
public class PaymentRequestService implements IPaymentRequestService {

    @Autowired
    private PaymentRequestRepository requestRepository;

    @Autowired
    private FlowRepository flowRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void saveRequest(User user, PaymentRequestMessage requestMessage) throws Exception {
        Flow flow = flowRepository.findByUuid(requestMessage.flowUuid());
        if (flow == null) {
            throw new Exception("Flow doesn't exist!");
        }

        val request = convert(user, requestMessage);
        requestRepository.save(request);
        log.debug("Saved payment request {}", request);
    }

    @Override
    public List<PaymentRequestMessage> getAllRequests(User user) {
        val requests = requestRepository.findByUserId(user.getId());
        return requests.stream()
                .map(r -> convert(user, r))
                .toList();
    }

    @Override
    public PaymentRequestMessage findByUUID(String uuid) {
        val request = requestRepository.findByUuid(uuid);
        if (request != null) {
            Optional<User> user = userRepository.findById(request.getUserId());
            if (user.isPresent()) {
                return convert(user.get(), request);
            }
        }
        return null;
    }

    @Override
    public void addProof(String uuid, String proof) throws Exception {
        val request = requestRepository.findByUuid(uuid);
        if (!request.isPayed()) {
            request.setProof(proof);
        } else {
            throw new Exception("Operation not allowed, payment request is completed");
        }
    }

    @Override
    public void acceptPayment(User user, String uuid) throws Exception {
        val request = requestRepository.findByUuid(uuid);
        if (request == null) {
            throw new Exception("PaymentRequest doesn't exist");
        } else if (!request.getUserId().equals(user.getId())) {
            throw new Exception("Authenticated user mismatch");
        }

        request.setPayed(true);
    }

    private static PaymentRequestMessage convert(User user, PaymentRequest request) {
        return new PaymentRequestMessage(user.getSigner(), request.getUuid(), request.getTitle(),
                request.getDescription(),
                request.getUuid(),
                request.getNetwork(), request.getAddress(), request.getAmount(),
                request.isPayed(), request.getProof());
    }

    private static PaymentRequest convert(User user, PaymentRequestMessage requestMessage) {
        val paymentRequest = new PaymentRequest(user.getId(), requestMessage.flowUuid(), requestMessage.title(),
                requestMessage.description(),
                requestMessage.network(), requestMessage.address(), requestMessage.amount());
        return paymentRequest;
    }
}
