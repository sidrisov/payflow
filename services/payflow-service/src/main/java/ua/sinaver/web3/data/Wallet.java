package ua.sinaver.web3.data;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@NoArgsConstructor
@Entity
@Table(uniqueConstraints = { @UniqueConstraint(columnNames = { "network", "address" }) })
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
