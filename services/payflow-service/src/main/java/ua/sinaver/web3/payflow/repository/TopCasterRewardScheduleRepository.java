package ua.sinaver.web3.payflow.repository;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.stereotype.Repository;
import ua.sinaver.web3.payflow.entity.TopCasterRewardSchedule;
import ua.sinaver.web3.payflow.entity.TopCasterRewardSchedule.ScheduleStatus;

import java.util.List;

@Repository
public interface TopCasterRewardScheduleRepository extends JpaRepository<TopCasterRewardSchedule,
		Integer> {

	@QueryHints(@QueryHint(name = AvailableSettings.JAKARTA_LOCK_TIMEOUT, value = "-2"))
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	List<TopCasterRewardSchedule> findTop10ByStatus(ScheduleStatus status);

	List<TopCasterRewardSchedule> findByUserIdAndStatus(Long userId, ScheduleStatus status);

}
