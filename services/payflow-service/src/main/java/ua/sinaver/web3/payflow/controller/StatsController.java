package ua.sinaver.web3.payflow.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.sinaver.web3.payflow.message.DailyStats;
import ua.sinaver.web3.payflow.service.StatsService;
import ua.sinaver.web3.payflow.data.ActiveUsersStats;
import java.util.List;

@RestController
@RequestMapping("/stats")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class StatsController {

	@Autowired
	private final StatsService statsService;

	@GetMapping("/daily")
	public DailyStats getDailyStats() {
		return statsService.fetchDailyStats();
	}

	@GetMapping("/active-users")
	public List<ActiveUsersStats> getActiveUsersStats() {
		return statsService.fetchActiveUsersStats();
	}
} 
