package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
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
		log.trace("{} fetching payments info for {} ",
				principal.getName(), hashes);

		val user = userService.findByIdentity(principal.getName());

		if (user == null || hashes.isEmpty()) {
			return Collections.emptyList();
		}

		return paymentRepository.findByHashIn(hashes).stream()
				.filter(payment -> payment.getReceiver().getIdentity().equals(user.getIdentity()))
				.map(payment -> new PaymentMessage(payment.getHash(),
						new PaymentMessage.PaymentSource(payment.getSourceApp(),
								payment.getSourceRef()), payment.getComment()))
				.toList();
	}
}
