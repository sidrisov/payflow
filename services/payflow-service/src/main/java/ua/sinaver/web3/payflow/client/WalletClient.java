package ua.sinaver.web3.payflow.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import ua.sinaver.web3.payflow.dto.WalletMessage;
import ua.sinaver.web3.payflow.service.WalletService;

import java.util.List;

@FeignClient(name = "wallet", url = "${payflow.onchain.url}/api/wallet")
public interface WalletClient {

	@GetMapping("/generate")
	List<WalletMessage> calculateWallets(
			@RequestParam List<String> owners,
			@RequestParam("nonce") String saltNonce);

	@PostMapping("/execute")
	WalletService.PaymentProcessingResponse processPayment(
			@RequestBody WalletService.PaymentProcessingRequest request);

	@GetMapping("/token/balance")
	WalletService.TokenBalance getTokenBalance(
			@RequestParam String address,
			@RequestParam Integer chainId,
			@RequestParam(required = false) String token);
}
