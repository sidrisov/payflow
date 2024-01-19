package ua.sinaver.web3.payflow.data;

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
public class InvitationAllowance {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
	private User user;

	@Column
	private Integer idenityInviteLimit = 0;

	@Column
	private Integer codeInviteLimit = 0;

	@Version
	private Long version;

	public InvitationAllowance(Integer idenityInviteLimit, Integer codeInviteLimit) {
		this.idenityInviteLimit = idenityInviteLimit;
		this.codeInviteLimit = codeInviteLimit;
	}
}
