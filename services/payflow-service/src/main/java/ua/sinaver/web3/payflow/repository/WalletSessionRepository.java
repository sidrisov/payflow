package ua.sinaver.web3.payflow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ua.sinaver.web3.payflow.data.WalletSession;

public interface WalletSessionRepository extends JpaRepository<WalletSession, Integer> {
	WalletSession findOneBySessionIdAndActiveTrue(String sessionId);
}
