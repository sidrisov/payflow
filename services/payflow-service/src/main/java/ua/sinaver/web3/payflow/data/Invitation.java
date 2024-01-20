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
		@UniqueConstraint(columnNames = {"identity"})})
public class Invitation {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	// no need to fetch, since the user who requests is the one authorized, so User
	// entity already fetched
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
	private Date expiryDate;

	@Version
	private Long version;

	public Invitation(String identity, String code) {
		this.identity = identity;
		this.code = code;
	}

}
