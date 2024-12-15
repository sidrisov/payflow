package ua.sinaver.web3.payflow.data.protocol;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@Entity
@Table(name = "client_api_key", uniqueConstraints = {
        @UniqueConstraint(name = "uc_client_identifier", columnNames = { "client_type", "client_identifier" }),
        @UniqueConstraint(name = "uc_api_key", columnNames = { "api_key" })
})
public class ClientApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column(name = "client_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private ClientType clientType;

    @Column(name = "client_identifier", nullable = false)
    private String clientIdentifier;

    @Column(name = "api_key", nullable = false)
    private String apiKey;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "active")
    private boolean active = true;

    @Version
    private Long version;

    public enum ClientType {
        ADDRESS,
        ENS,
        FID
    }

    public ClientApiKey(String name, ClientType clientType, String clientIdentifier) {
        this.name = name;
        this.clientType = clientType;
        this.clientIdentifier = clientIdentifier.toLowerCase();
        this.apiKey = UUID.randomUUID().toString();
    }
}
