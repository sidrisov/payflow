package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.log4j.Log4j2;
import lombok.val;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.entity.ActiveUsersStats;
import ua.sinaver.web3.payflow.message.DailyStats;
import ua.sinaver.web3.payflow.repository.ActiveUsersStatsRepository;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;

import java.time.LocalDate;
import java.util.List;

import static ua.sinaver.web3.payflow.config.CacheConfig.DAILY_STATS_CACHE;

@Service
@Transactional
@Log4j2
public class StatsService {

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PaymentRepository paymentRepository;

	@Autowired
	private ActiveUsersStatsRepository activeUsersStatsRepository;

	@Scheduled(initialDelay = 1000, fixedRate = Long.MAX_VALUE)
	@SchedulerLock(name = "StatsService_recordStats", lockAtLeastFor = "PT5M", lockAtMostFor = "PT10M")
	@CacheEvict(value = DAILY_STATS_CACHE, allEntries = true)
	void recordStats() {
		val stats = fetchDailyStats();

		val activeUsersStats = new ActiveUsersStats(
				LocalDate.now(),
				stats.dailyActiveUsers(),
				stats.weeklyActiveUsers(),
				stats.monthlyActiveUsers());
		activeUsersStatsRepository.save(activeUsersStats);

		log.info("Total Users: {}", stats.totalUsers());
		log.info("Active Users - DAU/WAU/MAU: {}/{}/{}",
				stats.dailyActiveUsers(),
				stats.weeklyActiveUsers(),
				stats.monthlyActiveUsers());
		log.info("Completed/Total Payments: {}/{}",
				stats.completedPayments(),
				stats.totalPayments());
		log.info("P2P Payments (including rewards): {}", stats.p2pPayments());
		log.info("Storage Units Purchased: {}", stats.storageUnitsPurchased());
		log.info("Fan Tokens Purchased: {}", stats.fanTokensPurchased());
		log.info("Mint Tokens Purchased: {}", stats.mintTokensPurchased());
		log.info("Hyper Subscriptions: {}", stats.hypersubMonthsSubscribed());
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
		val p2pPayments = paymentRepository.countCompletedPaymentsByCategories(List.of(
				"reward",
				"reward_top_reply", "reward_top_casters"));
		val storageUnitsPurchased = paymentRepository.countPurchasedAmountByCategory("fc_storage");
		val mintTokensPurchased = paymentRepository.countPurchasedAmountByCategory("mint");
		val fanTokensPurchased = paymentRepository.countPurchasedAmountByCategory("fan");
		val hyperSubscriptions = paymentRepository.countPurchasedAmountByCategory("hypersub");

		return new DailyStats(
				numberOfUsers,
				dau,
				wau,
				mau,
				numberOfPayments,
				numberOfCompletedPayments,
				p2pPayments,
				storageUnitsPurchased,
				mintTokensPurchased,
				fanTokensPurchased,
				hyperSubscriptions);
	}

	public List<ActiveUsersStats> fetchActiveUsersStats() {
		return activeUsersStatsRepository.findAll();
	}
}
