package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.entity.Payment;
import ua.sinaver.web3.payflow.message.farcaster.ValidatedFrameResponseMessage;

import java.net.URI;

@Slf4j
@Service
@Transactional
public class LinkService {

	@Autowired
	private PayflowConfig payflowConfig;

	public URI paymentLink(Payment payment, boolean frameV2Launcher) {
		if (frameV2Launcher) {
			val paymentUrl = UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
					.path("/payment/{refId}")
					.buildAndExpand(payment.getReferenceId())
					.toUriString();

			val paymentFrameLauncherUri = UriComponentsBuilder.fromHttpUrl("https://warpcast.com")
					.path("/~/frames/launch")
					.queryParam("url", paymentUrl)
					.encode()
					.build().toUri();

			log.debug("paymentFrameLauncherUri link: {}", paymentFrameLauncherUri);
			return paymentFrameLauncherUri;
		} else {
			return UriComponentsBuilder.fromHttpUrl(payflowConfig.getDAppServiceUrl())
					.path("/payment/{refId}")
					.buildAndExpand(payment.getReferenceId())
					.toUri();
		}
	}

	public URI frameV2PaymentLink(Payment payment) {
		val builder = UriComponentsBuilder
				.fromHttpUrl(payflowConfig.getDAppServiceUrl())
				.path("/payment/{refId}");

		builder.queryParam("fv2");

		return builder.buildAndExpand(payment.getReferenceId())
				.toUri();
	}

	public URI paymentLink(Payment payment, ValidatedFrameResponseMessage frameMessage,
			boolean checkWhitelist) {
		val frameV2Launcher = frameMessage.action().signer().client().username().equals("warpcast")
				&& (!checkWhitelist);
		return paymentLink(payment, frameV2Launcher);
	}
}
