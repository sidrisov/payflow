package ua.sinaver.web3.payflow.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;
import ua.sinaver.web3.payflow.entity.common.CustomJsonData;

import java.time.Instant;

@ToString
@Setter
@Getter
@NoArgsConstructor
@Entity
@Table
public class TopCasterRewardSchedule {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", referencedColumnName = "id")
	@ToString.Exclude
	private User user;

	@Column(name = "channel_id")
	private String channelId;

	@Column(name = "rewards")
	private Integer rewards;

	@Column(name = "usd_amount")
	private Double usdAmount;

	@Column(name = "token_amount")
	private Double tokenAmount;

	@Column(nullable = false)
	private String token;

	@Column(name = "chain_id", nullable = false)
	private Integer chainId;

	@Type(value = JsonType.class)
	@Column(columnDefinition = "json")
	private CustomJsonData criteria;

	@Column(name = "cron_expression")
	private String cronExpression;

	@Column(name = "last_attempt")
	@Temporal(TemporalType.TIMESTAMP)
	private Instant lastAttempt;

	@Column(name = "last_success")
	@Temporal(TemporalType.TIMESTAMP)
	private Instant lastSuccess;

	@Column
	private Integer failures = 0;

	@Column(length = 512)
	private String error;

	@Enumerated(EnumType.STRING)
	@Column
	private ScheduleStatus status = ScheduleStatus.ACTIVE;

	public void recordFailure(String error) {
		this.failures++;
		this.error = error;
		this.lastAttempt = Instant.now();
		if (this.failures >= 3) {
			this.status = ScheduleStatus.FAILED;
		}
	}

	public void recordSuccess() {
		this.failures = 0;
		this.error = null;
		this.lastSuccess = Instant.now();
		this.lastAttempt = Instant.now();
		this.status = ScheduleStatus.ACTIVE;
	}

	public enum ScheduleStatus {
		ACTIVE,
		FAILED,
		DISABLED
	}
}
