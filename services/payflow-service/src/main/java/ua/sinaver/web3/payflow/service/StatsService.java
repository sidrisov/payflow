package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.log4j.Log4j2;
import lombok.val;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.message.DailyStats;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;
import static ua.sinaver.web3.payflow.config.CacheConfig.DAILY_STATS_CACHE;

@Service
@Transactional
@Log4j2
public class StatsService {

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PaymentRepository paymentRepository;

	@Scheduled(cron = "0 0 0 * * *")
	@SchedulerLock(name = "StatsService_recordStats", lockAtLeastFor = "PT5M", lockAtMostFor = "PT10M")
	@CacheEvict(value = DAILY_STATS_CACHE, allEntries = true)
	void recordStats() {
		DailyStats stats = fetchDailyStats();

		log.info("Total Users: {}", stats.totalUsers());
		log.info("Active Users - DAU/WAU/MAU: {}/{}/{}",
				stats.dailyActiveUsers(),
				stats.weeklyActiveUsers(),
				stats.monthlyActiveUsers());
		log.info("Completed/Total Payments: {}/{}",
				stats.completedPayments(),
				stats.totalPayments());
		log.info("Storage Units Purchased: {}", stats.storageUnitsPurchased());
	}

	@CachePut(value = DAILY_STATS_CACHE, key = "'current'")
	protected DailyStats fetchAndCacheStats() {
		log.debug("Fetching daily stats from database");
		val numberOfUsers = userRepository.count();
		val dau = userRepository.countDailyActiveUsers();
		val wau = userRepository.countWeeklyActiveUsers();
		val mau = userRepository.countMonthlyActiveUsers();
		val numberOfPayments = paymentRepository.count();
		val numberOfCompletedPayments = paymentRepository.countAllCompletedPayments();
		val storageUnitsPurchased = paymentRepository.countStorageUnitsPurchased();

		return new DailyStats(
				numberOfUsers,
				dau,
				wau,
				mau,
				numberOfPayments,
				numberOfCompletedPayments,
				storageUnitsPurchased
		);
	}

	@Cacheable(value = DAILY_STATS_CACHE, key = "'current'")
	public DailyStats fetchDailyStats() {
		log.debug("Fetching daily stats from database");
		val numberOfUsers = userRepository.count();
		val dau = userRepository.countDailyActiveUsers();
		val wau = userRepository.countWeeklyActiveUsers();
		val mau = userRepository.countMonthlyActiveUsers();
		val numberOfPayments = paymentRepository.count();
		val numberOfCompletedPayments = paymentRepository.countAllCompletedPayments();
		val storageUnitsPurchased = paymentRepository.countStorageUnitsPurchased();

		return new DailyStats(
				numberOfUsers,
				dau,
				wau,
				mau,
				numberOfPayments,
				numberOfCompletedPayments,
				storageUnitsPurchased
		);
	}
}
