package ua.sinaver.web3.data;

import java.util.Date;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

// TODO: add indexes (for query search)
@ToString(exclude = "invitationAllowance")
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

    @Column(nullable = false)
    private String username;

    @Column
    private String profileImage;

    @Column(columnDefinition = "boolean")
    private boolean locked = false;

    @Column(columnDefinition = "boolean")
    private boolean allowed = false;

    // TODO: add identity
    @Column(nullable = false)
    private String signer;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "flow_id", referencedColumnName = "id")
    private Flow defaultFlow;

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private List<Flow> flows;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private InvitationAllowance invitationAllowance;

    @Column
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate = new Date();

    @Column
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastSeen = new Date();

    @Version
    private Long version;

    public User(String signer, String username) {
        this.signer = signer;
        this.username = username;
    }
}
