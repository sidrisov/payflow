package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.message.PaymentHashMessage;
import ua.sinaver.web3.payflow.message.PaymentMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.api.IUserService;

import java.security.Principal;
import java.util.Collections;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/payment")
@CrossOrigin(origins = "${payflow.dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
public class PaymentController {
	@Autowired
	private IUserService userService;

	@Autowired
	private PaymentRepository paymentRepository;

	@GetMapping
	public List<PaymentMessage> payments(@RequestParam(value = "hashes") List<String> hashes,
	                                     Principal principal) {

		val username = principal != null ? principal.getName() : null;
		log.debug("{} fetching payments info for {} ",
				username, hashes);

		if (hashes.isEmpty()) {
			return Collections.emptyList();
		}

		val user = username != null ? userService.findByIdentity(username) : null;
		val payments = paymentRepository.findByHashIn(hashes, user);

		log.debug("Fetched payments: {}", payments);
		return payments.stream()
				.map(payment -> PaymentMessage.convert(payment, false))
				.toList();
	}

	@GetMapping("/pending")
	public List<PaymentMessage> pendingPayments(Principal principal) {
		log.debug("Fetching pending payments for {} ",
				principal.getName());

		val user = userService.findByIdentity(principal.getName());

		if (user == null) {
			return Collections.emptyList();
		}

		return paymentRepository.findBySenderAndStatusAndTypeInOrderByCreatedDateDesc(
						user, Payment.PaymentStatus.PENDING,
						List.of(Payment.PaymentType.INTENT))
				.stream()
				.map(payment -> PaymentMessage.convert(payment, true))
				.toList();
	}

	@PutMapping("/{referenceId}")
	@ResponseStatus(HttpStatus.OK)
	public void paymentComplete(@PathVariable String referenceId,
	                            @RequestBody PaymentHashMessage hashMessage, Principal principal) {
		log.debug("Marking pending payment {} as complete with hash {} by user {}", referenceId,
				hashMessage,
				principal.getName());

		val user = userService.findByIdentity(principal.getName());

		if (user == null) {
			return;
		}

		val payment = paymentRepository.findByReferenceIdAndSender(referenceId, user);
		if (payment != null) {
			payment.setStatus(Payment.PaymentStatus.COMPLETED);
			payment.setHash(hashMessage.hash());
			payment.setCompletedDate(new Date());
			log.debug("Payment was marked as complete: {}", payment);
		}
	}
}
