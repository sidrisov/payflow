package ua.sinaver.web3.payflow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.data.WalletSession;

import java.time.Instant;
import java.util.List;

@Repository
public interface WalletSessionRepository extends JpaRepository<WalletSession, Long> {

	@Modifying
	@Query("UPDATE WalletSession w SET w.active = false, w.sessionKey = '0x0' " +
			"WHERE w.active = true AND w.expiresAt < :now")
	void deactivateExpiredSessions(Instant now);

	WalletSession findOneBySessionIdAndActiveTrue(String sessionId);

	@Query("SELECT ws FROM WalletSession ws " +
			"JOIN ws.wallet w " +
			"JOIN w.flow f " +
			"WHERE f.userId = :userId " +
			"AND ws.active = TRUE " +
			"AND ws.expiresAt > :now")
	List<WalletSession> findActiveSessionsByUser(Integer userId, Instant now);

	default List<WalletSession> findActiveSessionsByUser(User user) {
		return findActiveSessionsByUser(user.getId(), Instant.now());
	}
}
