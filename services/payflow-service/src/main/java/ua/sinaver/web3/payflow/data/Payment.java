package ua.sinaver.web3.payflow.data;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.apache.commons.lang3.RandomStringUtils;

import java.util.Date;

@ToString
@Setter
@Getter
@NoArgsConstructor
@Entity
@Table(uniqueConstraints = {
		@UniqueConstraint(name = "uc_payment_reference_id", columnNames = { "reference_id" }),
		@UniqueConstraint(name = "uc_payment_hash", columnNames = { "hash" })
})
public class Payment {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@Column(columnDefinition = "VARCHAR(256)", nullable = false)
	@Enumerated(EnumType.STRING)
	private PaymentType type;

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

	@Column
	private String hash;

	@Column(name = "fulfillment_id")
	private String fulfillmentId;

	@Column(name = "fulfillment_chain_id")
	private Integer fulfillmentChainId;

	@Column(name = "fulfillment_hash")
	private String fulfillmentHash;

	@Column(columnDefinition = "VARCHAR(256)", nullable = false)
	@Enumerated(EnumType.STRING)
	private PaymentStatus status = PaymentStatus.PENDING;

	@Column(name = "source_app")
	private String sourceApp;

	@Column(name = "source_ref")
	private String sourceRef;

	@Column(name = "source_hash")
	private String sourceHash;

	@Column
	private String comment;

	@Column(name = "created_date")
	@Temporal(TemporalType.TIMESTAMP)
	private Date createdDate = new Date();

	@Column(name = "completed_date")
	@Temporal(TemporalType.TIMESTAMP)
	private Date completedDate;

	@Version
	private Long version;

	public Payment(PaymentType type, User receiver, Integer network, String token) {
		this.type = type;
		this.receiver = receiver;
		this.network = network;
		this.token = token;
		this.referenceId = RandomStringUtils.random(8, true, true);
	}

	public enum PaymentStatus {
		PENDING,
		INPROGRESS,
		COMPLETED,
		REFUNDED,
		CANCELLED,
		EXPIRED
	}

	public enum PaymentType {
		APP,
		INTENT,
		FRAME,
		INTENT_TOP_REPLY
	}
}
