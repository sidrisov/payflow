package ua.sinaver.web3.payflow.controller.protocol;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.message.protocol.CreatePaymentRequest;
import ua.sinaver.web3.payflow.message.protocol.CreatePaymentResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import ua.sinaver.web3.payflow.data.protocol.ClientApiKey;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/protocol/payment")
public class ClientPaymentController {

	@PostMapping("/create")
	public ResponseEntity<CreatePaymentResponse> createPayment(
			@AuthenticationPrincipal ClientApiKey clientApiKey,
			@RequestBody CreatePaymentRequest request) {

		log.info("Creating payment via protocol for client: {} ({}), request: {}", 
				clientApiKey.getName(), 
				clientApiKey.getClientIdentifier(), 
				request);

		try {
			// For now just return a dummy response
			return ResponseEntity.ok(new CreatePaymentResponse("test-reference-id"));

		} catch (Exception e) {
			log.error("Error creating payment for client: " + clientApiKey.getClientIdentifier(), e);
			return ResponseEntity.badRequest().build();
		}
	}
}
