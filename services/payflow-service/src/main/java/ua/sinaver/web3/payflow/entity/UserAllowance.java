package ua.sinaver.web3.payflow.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@ToString
@Setter
@Getter
@NoArgsConstructor
@Entity
@Table
public class UserAllowance {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
	@ToString.Exclude
	private User user;

	@Column
	private Integer identityInviteLimit = 0;

	@Column
	private Integer codeInviteLimit = 0;

	@Column
	private Integer favouriteContactLimit = 0;

	@Version
	private Long version;

	public UserAllowance(Integer identityInviteLimit, Integer codeInviteLimit, Integer favouriteContactLimit) {
		this.identityInviteLimit = identityInviteLimit;
		this.codeInviteLimit = codeInviteLimit;
		this.favouriteContactLimit = favouriteContactLimit;
	}
}
