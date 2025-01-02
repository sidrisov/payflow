package ua.sinaver.web3.payflow.data;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.apache.commons.lang3.RandomStringUtils;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@ToString
@Setter
@Getter
@NoArgsConstructor
@Entity
@Table(uniqueConstraints = {
		@UniqueConstraint(name = "uc_payment_reference_id", columnNames = {"reference_id"}),
		@UniqueConstraint(name = "uc_payment_hash", columnNames = {"hash"})
})
public class Payment {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@Column(columnDefinition = "VARCHAR(256)", nullable = false)
	@Enumerated(EnumType.STRING)
	private PaymentType type;

	@Column(name = "name", length = 256)
	private String name;

	@Column(name = "reference_id", nullable = false)
	private String referenceId;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "sender_user_id", referencedColumnName = "id")
	@ToString.Exclude
	private User sender;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "receiver_user_id", referencedColumnName = "id")
	@ToString.Exclude
	private User receiver;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "receiver_flow_id", referencedColumnName = "id")
	@ToString.Exclude
	private Flow receiverFlow;

	@Column(name = "sender_address")
	private String senderAddress;

	@Column(name = "receiver_address")
	private String receiverAddress;

	@Column(name = "receiver_fid")
	private Integer receiverFid;

	@Column
	private String category;

	@Column(nullable = false)
	private Integer network;

	@Column(nullable = false)
	private String token;

	@Column(name = "usd_amount")
	private String usdAmount;

	@Column(name = "token_amount")
	private String tokenAmount;

	@Type(JsonType.class)
	@Column(columnDefinition = "json")
	private JsonNode calls;

	@Column
	private String hash;

	@Column(name = "fulfillment_id")
	private String fulfillmentId;

	@Column(name = "fulfillment_chain_id")
	private Integer fulfillmentChainId;

	@Column(name = "fulfillment_hash")
	private String fulfillmentHash;

	@Column(name = "refund_hash")
	private String refundHash;

	@Column(columnDefinition = "VARCHAR(256)", nullable = false)
	@Enumerated(EnumType.STRING)
	private PaymentStatus status = PaymentStatus.CREATED;

	@Column(name = "source_app")
	private String sourceApp;

	@Column(name = "source_ref")
	private String sourceRef;

	@Column(name = "source_hash")
	private String sourceHash;

	@Column
	private String comment;

	@Column(name = "created_at")
	@Temporal(TemporalType.TIMESTAMP)
	private Instant createdAt = Instant.now();

	@Column(name = "completed_at")
	@Temporal(TemporalType.TIMESTAMP)
	private Instant completedAt;

	@Column(name = "expires_at")
	@Temporal(TemporalType.TIMESTAMP)
	private Instant expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);

	@Version
	private Long version;

	@Column(name = "target", length = 512)
	private String target;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "wallet_session_id", referencedColumnName = "id")
	@ToString.Exclude
	private WalletSession walletSession;

	@Column(length = 512)
	private String error;

	@Column
	private Integer failures = 0;

	public Payment(PaymentType type, User receiver, Integer network, String token) {
		this.type = type;
		this.receiver = receiver;
		this.network = network;
		this.token = token;
		this.referenceId = RandomStringUtils.random(8, true, true);
	}

	public enum PaymentStatus {
		CREATED,
		INPROGRESS,
		COMPLETED,
		PENDING_REFUND,
		REFUNDED,
		CANCELLED,
		EXPIRED,
		FAILED
	}

	public enum PaymentType {
		APP,
		INTENT,
		SESSION_INTENT,
		FRAME
	}

	public void recordFailure(String error) {
		this.failures = (this.failures != null ? this.failures : 0) + 1;
		this.error = error;
		if (this.failures >= 3) {
			this.status = PaymentStatus.FAILED;
		}
	}

	public void clearError() {
		this.failures = 0;
		this.error = null;
	}
}
