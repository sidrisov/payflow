package ua.sinaver.web3.payflow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.sinaver.web3.payflow.data.protocol.ClientApiKey;

import java.util.Optional;

@Repository
public interface ClientApiKeyRepository extends JpaRepository<ClientApiKey, Integer> {
	Optional<ClientApiKey> findByApiKey(String apiKey);
}
