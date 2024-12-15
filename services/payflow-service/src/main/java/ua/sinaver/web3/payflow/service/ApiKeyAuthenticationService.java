package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.protocol.ClientApiKey;
import ua.sinaver.web3.payflow.repository.ClientApiKeyRepository;

import java.time.Instant;

@Service
@Slf4j
@Transactional
public class ApiKeyAuthenticationService {

	@Autowired
	private ClientApiKeyRepository apiKeyRepository;

	public ClientApiKey validateApiKey(String apiKey) {
		if (apiKey == null) {
			return null;
		}

		try {
			val clientApiKey = apiKeyRepository.findByApiKey(apiKey);

			if (clientApiKey.isEmpty() || !clientApiKey.get().isActive()) {
				return null;
			}

			// Update last used timestamp
			val key = clientApiKey.get();
			key.setLastUsedAt(Instant.now());
			return key;
		} catch (Exception e) {
			log.error("Error validating API key", e);
			return null;
		}
	}
}
