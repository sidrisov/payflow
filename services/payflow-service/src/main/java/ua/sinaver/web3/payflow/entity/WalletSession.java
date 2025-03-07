package ua.sinaver.web3.payflow.entity;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@ToString
@Setter
@Getter
@NoArgsConstructor
@Entity
@Table(name = "wallet_session")
public class WalletSession {

	public static final Integer EXPIRES_AFTER_HOURS = 1;
    
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@Column(name = "session_id", nullable = false)
	private String sessionId;

	@ToString.Exclude
	@Column(name = "session_key", nullable = false)
	private String sessionKey;

	@Type(JsonType.class)
	@Column(name = "actions", columnDefinition = "json")
	private JsonNode actions;

	@Column(name = "active", nullable = false)
	private Boolean active = true;

	@Column(name = "created_at")
	@Temporal(TemporalType.TIMESTAMP)
	private Instant createdAt = Instant.now();

	@Column(name = "expires_at")
	@Temporal(TemporalType.TIMESTAMP)
	private Instant expiresAt = Instant.now().plus(EXPIRES_AFTER_HOURS, ChronoUnit.HOURS);

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "wallet_id", referencedColumnName = "id")
	@ToString.Exclude
	private Wallet wallet;

	@Version
	private Long version;
}
