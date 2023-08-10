package ua.sinaver.web3.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.transaction.Transactional;
import lombok.val;
import lombok.extern.slf4j.Slf4j;
import ua.sinaver.web3.message.PaymentRequestMessage;
import ua.sinaver.web3.message.ProofMessage;
import ua.sinaver.web3.service.IPaymentRequestService;
import ua.sinaver.web3.service.IUserService;

@RestController
@RequestMapping("/requests")
@CrossOrigin(origins = "${dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
public class PaymentRequestController {

    @Autowired
    private IUserService userService;

    @Autowired
    private IPaymentRequestService requestService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void createRequest(@RequestBody PaymentRequestMessage requestMessage, Principal principal) throws Exception {
        val user = userService.findUser(principal.getName());
        if (user == null) {
            throw new Exception("User doesn't exist: " + principal.getName());
        }

        log.debug("createRequest: {}", requestMessage);

        requestService.saveRequest(user, requestMessage);
    }

    @GetMapping
    public List<PaymentRequestMessage> getAllRequests(Principal principal) throws Exception {
        val user = userService.findUser(principal.getName());
        if (user == null) {
            throw new Exception("User doesn't exist: " + principal.getName());
        }

        return requestService.getAllRequests(user);
    }

    @GetMapping("/{uuid}")
    public PaymentRequestMessage getRequestByUUID(@PathVariable String uuid) {
        val requestMessage = requestService.findByUUID(uuid);

        if (requestMessage.payed()) {
            log.info("Payment Request is payed! Payment is closed!");
            return null;
        }

        log.debug("{}", requestMessage);
        return requestMessage;
    }

    @PostMapping("/{uuid}/proof")
    @ResponseStatus(HttpStatus.CREATED)
    public void submitPaymentProof(@PathVariable String uuid, @RequestBody ProofMessage proof, Principal principal)
            throws Exception {

        log.debug("submitProof: {} {}", uuid);
        requestService.addProof(uuid, proof.txHash());
    }

    @PostMapping("/{uuid}/payed")
    @ResponseStatus(HttpStatus.OK)
    public void acceptPayment(@PathVariable String uuid, Principal principal)
            throws Exception {
        val user = userService.findUser(principal.getName());
        if (user == null) {
            throw new Exception("User doesn't exist: " + principal.getName());
        }

        log.debug("acceptPayment: {} ", uuid);
        requestService.acceptPayment(user, uuid);
    }
}
