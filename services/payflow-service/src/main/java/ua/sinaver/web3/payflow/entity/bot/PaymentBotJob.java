package ua.sinaver.web3.payflow.entity.bot;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;
import ua.sinaver.web3.payflow.message.farcaster.Cast;

import java.time.Instant;

@ToString
@Setter
@Getter
@NoArgsConstructor
@Entity
@Table(indexes = {
		@Index(name = "idx_payment_bot_job_status_casted_date_asc", columnList = "status,casted_date ASC"),
		// needed to fetch the latest casted_date
		@Index(name = "idx_payment_bot_job_casted_date_desc", columnList = "casted_date DESC")
}, uniqueConstraints = {
		@UniqueConstraint(name = "uc_cast_hash", columnNames = {"cast_hash"})
})
public class PaymentBotJob {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@Column(name = "cast_hash", nullable = false)
	private String castHash;

	@Column(name = "cast_fid", nullable = false)
	private Integer casterFid;

	@Type(value = JsonType.class)
	@Column(columnDefinition = "json")
	private Cast cast;

	@Column(name = "casted_at", nullable = false)
	@Temporal(TemporalType.TIMESTAMP)
	private Instant castedAt;
	
	@Column(name = "created_at", nullable = false)
	@Temporal(TemporalType.TIMESTAMP)
	private Instant createdAt = Instant.now();

	@Column(columnDefinition = "VARCHAR(256)", nullable = false)
	@Enumerated(EnumType.STRING)
	private Status status = Status.CREATED;

	public PaymentBotJob(String castHash, Integer casterFid, Instant castedAt, Cast cast) {
		this.castHash = castHash;
		this.casterFid = casterFid;
		this.castedAt = castedAt;
		this.cast = cast;
	}

	public enum Status {
		CREATED,
		REJECTED,
		ERROR,
		PROCESSED
	}
}
