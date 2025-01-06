package ua.sinaver.web3.payflow.repository;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.stereotype.Repository;
import ua.sinaver.web3.payflow.data.bot.PaymentBotJob;

import java.util.Optional;
import java.util.stream.Stream;

@Repository
public interface PaymentBotJobRepository extends JpaRepository<PaymentBotJob, Long> {
	Optional<PaymentBotJob> findFirstByOrderByCastedDateDesc();

	// JPA: UPGRADE_SKIPLOCKED - PESSIMISTIC_WRITE
	@QueryHints(@QueryHint(name = AvailableSettings.JAKARTA_LOCK_TIMEOUT, value = "-2"))
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Stream<PaymentBotJob> findTop10ByStatusOrderByCastedDateAsc(PaymentBotJob.Status status);

	@QueryHints(@QueryHint(name = AvailableSettings.JAKARTA_LOCK_TIMEOUT, value = "-2"))
	@Query("SELECT j FROM PaymentBotJob j WHERE j.id = :id")
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<PaymentBotJob> findWithLockById(Integer id);
}
