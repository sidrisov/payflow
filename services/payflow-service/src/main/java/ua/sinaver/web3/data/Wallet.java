package ua.sinaver.web3.data;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Setter
@Getter
@NoArgsConstructor
@Entity
@Table(uniqueConstraints = {@UniqueConstraint(columnNames = {"network", "address"})})
public class Wallet {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@Column
	private String address;

	@Column
	private Integer network;

	@Column
	private String walletVersion;

	@Column(columnDefinition = "boolean")
	private boolean deployed;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "flow_id", nullable = false)
	private Flow flow;

	@Column
	@Temporal(TemporalType.TIMESTAMP)
	private Date createdDate = new Date();

	@Version
	private Long version;

	public Wallet(String address, Integer network, String walletVersion,
	              boolean safeDeployed) {
		this.address = address;
		this.network = network;
		this.walletVersion = walletVersion;
		this.deployed = safeDeployed;
	}

	@Override
	public String toString() {
		return "Wallet [id=" + id + ", address=" + address + ", network=" + network + ", flow="
				+ flow.getUuid() + ", walletProvider=" + flow.getWalletProvider() + ", walletVersion="
				+ walletVersion + ", deployed="
				+ deployed + "]";
	}
}
