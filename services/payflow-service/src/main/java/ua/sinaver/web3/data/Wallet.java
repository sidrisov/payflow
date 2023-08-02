package ua.sinaver.web3.data;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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
    private String network;

    @Column
    private boolean smart;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "flow_id", nullable = false)
    private Flow flow;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "account_id", nullable = true)
    private Account master;

    @Version
    private Long version;

    public Wallet(String address, String network, boolean smart) {
        this.address = address;
        this.network = network;
        this.smart = smart;
    }

    @Override
    public String toString() {
        return "Wallet [id=" + id + ", address=" + address + ", network=" + network + ", smart=" + smart + ", flow="
                + flow.getUuid() + ", master="
                + (master != null ? master.getAddress() : "null") + "]";
    }
}
