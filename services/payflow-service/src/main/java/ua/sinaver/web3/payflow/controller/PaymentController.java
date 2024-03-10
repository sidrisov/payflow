package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.message.PaymentMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.api.IUserService;

import java.security.Principal;
import java.util.Collections;
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
		log.debug("{} fetching payments info for {} ",
				principal.getName(), hashes);

		val user = userService.findByIdentity(principal.getName());

		if (user == null || hashes.isEmpty()) {
			return Collections.emptyList();
		}

		return paymentRepository.findByHashInAndReceiver(hashes, user).stream()
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
}
