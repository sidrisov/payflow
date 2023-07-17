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

    public Wallet() {
    }

    public Wallet(String address, String network, boolean smart) {
        this.address = address;
        this.network = network;
        this.smart = smart;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getNetwork() {
        return network;
    }

    public void setNetwork(String network) {
        this.network = network;
    }

    public boolean isSmart() {
        return smart;
    }

    public void setSmart(boolean smart) {
        this.smart = smart;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public Flow getFlow() {
        return flow;
    }

    public void setFlow(Flow flow) {
        this.flow = flow;
    }

    public Account getMaster() {
        return master;
    }

    public void setMaster(Account master) {
        this.master = master;
    }

    @Override
    public String toString() {
        return "Wallet [id=" + id + ", address=" + address + ", network=" + network + ", smart=" + smart + ", flow="
                + flow.getUUID() + ", master="
                + (master != null ? master.getAddress() : "null") + "]";
    }

}
