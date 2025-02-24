package ua.sinaver.web3.payflow.repository;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import ua.sinaver.web3.payflow.entity.StorageNotification;

import java.time.Instant;
import java.util.Optional;
import java.util.stream.Stream;

import org.springframework.stereotype.Repository;

@Repository
public interface StorageNotificationRepository extends JpaRepository<StorageNotification, Integer> {
	Optional<StorageNotification> findByFid(Integer fid);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@QueryHints(@QueryHint(name = AvailableSettings.JAKARTA_LOCK_TIMEOUT, value = "-2"))
	@Query("SELECT sn FROM StorageNotification sn WHERE sn.enabled = TRUE AND (sn.lastCheckedAt IS NULL OR sn.lastCheckedAt < :checkedAt) ORDER BY sn.lastCheckedAt ASC LIMIT 10")
	Stream<StorageNotification> findTop10StorageNotifications(Instant checkedAt);
}
