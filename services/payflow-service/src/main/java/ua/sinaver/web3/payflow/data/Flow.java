package ua.sinaver.web3.payflow.data;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;

import java.util.Date;
import java.util.List;

@ToString
@Setter
@Getter
@NoArgsConstructor
@Entity
@Table(indexes = {@Index(columnList = "user_id"), @Index(columnList = "uuid")})
public class Flow {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@Column(name = "user_id")
	private Integer userId;

	@Column(columnDefinition = "VARCHAR(256)")
	@Enumerated(EnumType.STRING)
	private FlowType type;

	@Column
	private String title;

	@Column(columnDefinition = "boolean")
	private boolean shareable;

	@Column(unique = true)
	private String uuid;

	@Column
	private String walletProvider;

	@Column
	private String signer;

	@Column(name = "signer_provider")
	private String signerProvider;

	@Column(name = "signer_type")
	private String signerType;

	@Column(name = "signer_credential")
	private String signerCredential;

	@Column
	private String saltNonce;

	@OneToMany(mappedBy = "flow", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval =
			true)
	private List<Wallet> wallets;

	@Column(columnDefinition = "boolean")
	private boolean archived = false;

	@Column(columnDefinition = "boolean")
	private boolean disabled = false;

	@Column
	@Temporal(TemporalType.TIMESTAMP)
	private Date createdDate = new Date();

	@Version
	private Long version;

	public Flow(Integer userId, String title, String signer,
	            String signerProvider,
	            String signerType, String signerCredential,
	            String walletProvider,
	            String saltNonce) {
		this.userId = userId;
		this.title = title;
		this.uuid = RandomStringUtils.random(8, true, true);

		this.signer = signer != null ? signer.toLowerCase() : null;
		this.signerProvider = signerProvider;
		this.signerType = signerType;
		this.signerCredential = signerCredential;
		this.walletProvider = walletProvider;
		if (StringUtils.isBlank(saltNonce)) {
			this.saltNonce = this.uuid;
		} else {
			this.saltNonce = saltNonce;
		}
	}

	public enum FlowType {
		REGULAR,
		FARCASTER_VERIFICATION,
		LINKED,
		JAR
	}
}
