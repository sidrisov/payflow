package ua.sinaver.web3.payflow.repository;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.payflow.data.bot.PaymentBotJob;

import java.util.Optional;
import java.util.stream.Stream;

public interface PaymentBotJobRepository extends CrudRepository<PaymentBotJob, Integer> {
	Optional<PaymentBotJob> findFirstByOrderByCastedDateDesc();

	// JPA: UPGRADE_SKIPLOCKED - PESSIMISTIC_WRITE with a
	// javax.persistence.lock.timeout setting of -2
	// https://docs.jboss.org/hibernate/orm/5.0/userguide/html_single/chapters/locking/Locking.html
	@QueryHints(@QueryHint(name = AvailableSettings.JAKARTA_LOCK_TIMEOUT, value = "-2"))
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Stream<PaymentBotJob> findTop10ByStatusOrderByCastedDateAsc(PaymentBotJob.Status status);
}
