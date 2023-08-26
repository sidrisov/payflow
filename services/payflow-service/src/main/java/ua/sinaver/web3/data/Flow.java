package ua.sinaver.web3.data;

import java.util.List;

import org.apache.commons.lang3.RandomStringUtils;

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
@Table(indexes = { @Index(columnList = "userId"), @Index(columnList = "uuid") })
public class Flow {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @Column
    private Integer userId;

    @Column
    private String title;

    @Column
    private String description;

    @Column(columnDefinition = "boolean")
    private boolean shareable;

    @Column(unique = true)
    private String uuid;

    @OneToMany(mappedBy = "flow", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Wallet> wallets;

    @Version
    private Long version;

    public Flow(Integer userId, String title, String description) {
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.uuid = RandomStringUtils.random(8, true, true);
    }
}
