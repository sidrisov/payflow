package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.Payment;

@Slf4j
@Service
public class ReceiptService {

	public String getReceiptUrl(Payment payment) {
		val baseUrl = switch (payment.getNetwork()) {
			case 8453 -> // Base Chain ID
					"https://basescan.org";
			case 10 -> // Optimism Chain ID
					"https://optimistic.etherscan.io";
			case 7777777 -> // Zora Chain ID
					"https://explorer.zora.energy";
			case 666666666 -> // Degen Chain ID
					"https://explorer.degen.tips";
			case 42161 -> // Arbitrum Chain ID
					"https://arbiscan.io";
			case 34443 -> // Mode Chain ID
					"https://modescan.io";
			default ->
					throw new IllegalArgumentException("Chain " + payment.getNetwork() + " not " +
							"supported!");
		};

		val receiptHash = payment.getFulfillmentHash() != null ? payment.getFulfillmentHash() :
				payment.getHash();
		return baseUrl + "/tx/" + receiptHash;
	}
}
