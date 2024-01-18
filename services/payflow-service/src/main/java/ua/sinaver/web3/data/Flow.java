package ua.sinaver.web3.data;

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

	@Column
	private String title;

	@Column
	private String description;

	@Column(columnDefinition = "boolean")
	private boolean shareable;

	@Column(unique = true)
	private String uuid;

	@Column
	private String walletProvider;

	@Column
	private String saltNonce;

	@OneToMany(mappedBy = "flow", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Wallet> wallets;

	@Column
	@Temporal(TemporalType.TIMESTAMP)
	private Date createdDate = new Date();

	@Version
	private Long version;

	public Flow(Integer userId, String title, String description, String walletProvider, String saltNonce) {
		this.userId = userId;
		this.title = title;
		this.description = description;
		this.uuid = RandomStringUtils.random(8, true, true);

		this.walletProvider = walletProvider;
		if (StringUtils.isBlank(saltNonce)) {
			this.saltNonce = this.uuid;
		} else {
			this.saltNonce = saltNonce;
		}
	}
}
