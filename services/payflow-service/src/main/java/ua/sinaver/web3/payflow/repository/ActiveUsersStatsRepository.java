package ua.sinaver.web3.payflow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ua.sinaver.web3.payflow.entity.ActiveUsersStats;

import java.time.LocalDate;

@Repository
public interface ActiveUsersStatsRepository extends JpaRepository<ActiveUsersStats, LocalDate> {
}
