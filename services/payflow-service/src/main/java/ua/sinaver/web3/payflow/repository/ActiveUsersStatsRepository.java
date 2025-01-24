package ua.sinaver.web3.payflow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ua.sinaver.web3.payflow.entity.ActiveUsersStats;

import java.time.LocalDate;

public interface ActiveUsersStatsRepository extends JpaRepository<ActiveUsersStats, LocalDate> {
}
