package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.log4j.Log4j2;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;

@Service
@Transactional
@Log4j2
public class StatsService {

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PaymentRepository paymentRepository;

	@Scheduled(cron = "0 */10 * * * *")
	void recordStats() {

		val numberOfUsers = userRepository.count();
		log.info("Total Users: {}", numberOfUsers);

		val dau = userRepository.countDailyActiveUsers();
		val wau = userRepository.countWeeklyActiveUsers();
		val mau = userRepository.countMonthlyActiveUsers();
		log.info("Active Users - DAU/WAU/MAU: {}/{}/{}", dau, wau, mau);

		val numberOfPayments = paymentRepository.count();
		val numberOfCompletedPayments = paymentRepository.countAllCompletedPayments();

		log.info("Completed/Total Payments: {}/{}", numberOfCompletedPayments, numberOfPayments);

	}
}
