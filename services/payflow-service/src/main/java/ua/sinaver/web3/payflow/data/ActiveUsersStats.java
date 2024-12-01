package ua.sinaver.web3.payflow.data;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "active_users_stats")
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ActiveUsersStats {
	@Id
	private LocalDate date;

	@Column(name = "daily_active_users")
	private long dailyActiveUsers;

	@Column(name = "weekly_active_users")
	private long weeklyActiveUsers;

	@Column(name = "monthly_active_users")
	private long monthlyActiveUsers;
}
