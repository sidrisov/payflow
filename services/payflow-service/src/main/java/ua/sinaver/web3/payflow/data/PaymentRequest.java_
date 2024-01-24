package ua.sinaver.web3.data;

import java.util.Date;

import org.apache.commons.lang3.RandomStringUtils;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
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
@Table(indexes = { @Index(columnList = "user_id,payed,proof"), @Index(columnList = "uuid") })
public class PaymentRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    // TODO: add one-to-one mapping with flow, compare performance
    @Column
    private String flowUuid;

    @Column
    private String title;

    @Column
    private String description;

    @Column
    private String uuid;

    @Column
    private Integer network;

    @Column
    private String address;

    @Column
    private String amount;

    @Column
    private String proof;

    @Column(columnDefinition = "boolean")
    private boolean payed;

    @Column
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate = new Date();

    @Version
    private Long version;

    public PaymentRequest(Integer userId, String flowUuid, String title, String description, Integer network,
            String address,
            String amount) {
        this.userId = userId;
        this.flowUuid = flowUuid;
        this.title = title;
        this.description = description;
        this.uuid = RandomStringUtils.random(8, true, true);
        this.network = network;
        this.address = address;
        this.amount = amount;
    }
}
