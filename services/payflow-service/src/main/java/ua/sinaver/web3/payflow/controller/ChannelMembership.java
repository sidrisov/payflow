package ua.sinaver.web3.payflow.controller;


import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.IdentityService;

@RestController
@RequestMapping("/farcaster/membership")
@Slf4j
public class ChannelMembership {

	@Autowired
	private IdentityService identityService;

	@Autowired
	private PaymentRepository paymentRepository;

	@GetMapping("/allowed")
	public Boolean membership(@RequestParam Integer fid) {
		log.debug("Checking whether membership allowed for fid {} based on number of outbound " +
				"completed " +
				"payments", fid);
		val verifications = identityService.getFidAddresses(fid).stream()
				.map(String::toLowerCase).toList();
		if (verifications.isEmpty()) {
			return false;
		}

		val users = identityService.getProfiles(verifications);
		if (users == null || users.isEmpty()) {
			return false;
		}

		val numberOfPayments = paymentRepository.findNumberOutboundCompleted(
				users, verifications);

		val isMembershipAllowed = numberOfPayments >= 5;

		log.debug("Membership for fid {}: number of outbound completed - {} " +
				"allowed - {}", fid, numberOfPayments, isMembershipAllowed);

		return isMembershipAllowed;
	}
}
