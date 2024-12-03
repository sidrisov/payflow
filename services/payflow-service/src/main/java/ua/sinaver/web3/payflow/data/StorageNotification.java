package ua.sinaver.web3.payflow.data;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@ToString
@Setter
@Getter
@NoArgsConstructor
@Entity
@Table(uniqueConstraints = {
		@UniqueConstraint(name = "uc_storage_notification_fid", columnNames = {"fid"})
})
public class StorageNotification {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@Column(name = "fid", nullable = false)
	private Integer fid;

	@Column(columnDefinition = "boolean")
	private boolean enabled = true;

	@Column
	private Integer threshold = 20;

	@Column(name = "capacity_type")
	@Enumerated(EnumType.STRING)
	private CapacityType capacityType = CapacityType.CASTS_ONLY;

	@Column(name = "last_checked_at")
	@Temporal(TemporalType.TIMESTAMP)
	private Instant lastCheckedAt;

	@Version
	private Long version;

	@Column(name = "notify_with_message", columnDefinition = "boolean")
	private boolean notifyWithMessage = true;

	@Column(name = "notify_with_cast", columnDefinition = "boolean")
	private boolean notifyWithCast = true;

	public StorageNotification(Integer fid) {
		this.fid = fid;
	}

	public enum CapacityType {
		ALL,
		CASTS_ONLY
	}
}
