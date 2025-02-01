package ua.sinaver.web3.payflow.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;
import java.util.Date;
import java.util.List;

@ToString
@Setter
@Getter
@NoArgsConstructor
@Entity
@Table(indexes = {
		// TODO: replace @Index(name = "idx_user_last_updated_contacts", columnList =
		// "allowed", "last_updated_contacts"),
		@Index(name = "idx_user_last_updated_contacts", columnList = "last_updated_contacts"),
}, uniqueConstraints = {
		@UniqueConstraint(name = "uc_user_identity", columnNames = {"identity"}),
		@UniqueConstraint(name = "uc_user_signer", columnNames = {"signer"}),
		@UniqueConstraint(name = "uc_user_username", columnNames = {"username"}),
		@UniqueConstraint(name = "uc_user_display_name", columnNames = {"display_name"})
})
public class User {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@Column(name = "display_name")
	private String displayName;

	@Column
	private String username;

	@Column
	private String profileImage;

	@Column(columnDefinition = "boolean")
	private boolean locked = false;

	@Column(columnDefinition = "boolean")
	private boolean allowed = false;

	@Column(nullable = false)
	private String identity;

	@Column
	private String signer;

	@OneToOne(cascade = CascadeType.ALL)
	@JoinColumn(name = "flow_id", referencedColumnName = "id")
	private Flow defaultFlow;

	@Column(name = "default_receiving_address")
	private String defaultReceivingAddress;

	@OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
	@JoinColumn(name = "user_id", referencedColumnName = "id")
	@ToString.Exclude
	private List<Flow> flows;

	@OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
	private PreferredTokens preferredTokens;

	@Column(name = "preferred_farcaster_client")
	@Enumerated(EnumType.STRING)
	private FarcasterClient preferredFarcasterClient = FarcasterClient.WARPCAST;

	@Column
	@Temporal(TemporalType.TIMESTAMP)
	private Instant createdDate = Instant.now();

	@Column
	@Temporal(TemporalType.TIMESTAMP)
	private Date lastSeen = new Date();

	@Column
	@Temporal(TemporalType.TIMESTAMP)
	private Date lastUpdatedContacts;

	@ToString.Exclude
	@Column(name = "access_token")
	private String accessToken;

	@Version
	private Long version;

	public User(String identity) {
		this.identity = identity.toLowerCase();
		this.defaultReceivingAddress = identity.toLowerCase();
	}

	public enum FarcasterClient {
		WARPCAST,
		RECASTER,
		FARQUEST
	}
}
