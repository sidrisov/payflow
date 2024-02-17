package ua.sinaver.web3.payflow.data;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Date;

@ToString
@Setter
@Getter
@NoArgsConstructor
@Entity
@Table(uniqueConstraints = {
		@UniqueConstraint(name = "uc_contact_user_id_identity", columnNames = {"user_id",
				"identity"})})
public class Contact {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@Column(nullable = false)
	private String identity;

	@ManyToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
	private User user;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "identity", referencedColumnName = "identity", insertable = false, updatable = false)
	private User profile;

	@Column(columnDefinition = "boolean")
	private boolean profileChecked;

	@Column(columnDefinition = "boolean")
	private boolean addressChecked;

	@Column
	@Temporal(TemporalType.TIMESTAMP)
	private Date createdDate = new Date();

	@Version
	private Long version;

	public Contact(User user, String identity) {
		this.identity = identity;
		this.user = user;
	}
}
