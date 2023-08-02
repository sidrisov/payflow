package ua.sinaver.web3.data;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@ToString
@Setter
@Getter
@NoArgsConstructor
@Entity
@Table(indexes = @Index(columnList = "userId"), uniqueConstraints = {
        @UniqueConstraint(columnNames = { "network", "address" }) })
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @Column
    private Integer userId;

    @Column
    private String address;

    @Column
    private String network;

    @OneToMany(mappedBy = "master", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Wallet> wallets;

    @Version
    private Long version;

    public Account(Integer userId, String address, String network) {
        this.userId = userId;
        this.address = address;
        this.network = network;
    }
}
