package ua.sinaver.web3.data;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
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
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = { "signer" }),
        @UniqueConstraint(columnNames = { "username" }) })
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @Column
    private String displayName;

    @Column
    private String username;

    @Column
    private String profileImage;

    @Column(columnDefinition = "boolean")
    private boolean locked;

    // TODO: add identity
    @Column
    private String signer;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "flow_id", referencedColumnName = "id")
    private Flow defaultFlow;

    @Version
    private Long version;

    public User(String signer, String username) {
        this.signer = signer;
        this.username = username;
    }
}
