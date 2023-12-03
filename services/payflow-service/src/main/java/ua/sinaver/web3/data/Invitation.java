package ua.sinaver.web3.data;

import java.util.Date;
import java.util.concurrent.TimeUnit;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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

@ToString
@Setter
@Getter
@NoArgsConstructor
@Entity
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = { "identity" }) })
public class Invitation {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    // no need to fetch, since the user who requests is the one authorized, so User
    // entity alredy fetched
    @ManyToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by_id", referencedColumnName = "id")
    private User invitedBy;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "invitee_id", referencedColumnName = "id")
    private User invitee;

    @Column
    private String identity;

    @Column
    private String code;

    @Column
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate = new Date();

    @Column
    @Temporal(TemporalType.TIMESTAMP)
    // TODO: make expiry configurable
    private Date expiryDate = new Date(new Date().getTime() + TimeUnit.DAYS.toMillis(14));

    @Version
    private Long version;

    public Invitation(String identity, String code) {
        this.identity = identity;
        this.code = code;
    }

}
