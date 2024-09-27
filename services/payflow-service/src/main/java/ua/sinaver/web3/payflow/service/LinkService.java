package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.data.Payment;

import java.net.URI;

@Slf4j
@Service
@Transactional
public class LinkService {

	@Autowired
	private PayflowConfig payflowConfig;

	public URI paymentLink(Payment payment, boolean miniApp) {
		if (miniApp) {
			val composerLink = UriComponentsBuilder.fromHttpUrl(payflowConfig.getApiServiceUrl())
					.path("/api/farcaster/composer/pay")
					.queryParam("action", "payment")
					.queryParam("refId", payment.getReferenceId())
					.build().toUriString();

			log.debug("Composer link: {}", composerLink);

			val paymentLink = UriComponentsBuilder.fromHttpUrl("https://warpcast.com")
					.path("/~/composer-action")
					.queryParam("url", composerLink)
					.encode()
					.build().toUri();

			log.debug("paymentLink link: {}", composerLink);
			return paymentLink;
		} else {
			return UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
					.path("/payment/{refId}")
					.buildAndExpand(payment.getReferenceId())
					.toUri();
		}
	}
}
