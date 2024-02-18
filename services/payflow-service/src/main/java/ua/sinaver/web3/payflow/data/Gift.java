package ua.sinaver.web3.payflow.data;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Setter
@Getter
@NoArgsConstructor
@Entity
@Table(uniqueConstraints = {
		@UniqueConstraint(name = "uc_gift_gifter_gifted_user_id", columnNames = {"gifter_user_id",
				"gifted_user_id"})})
public class Gift {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "gifter_user_id", referencedColumnName = "id", nullable = false)
	private User gifter;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "gifted_user_id", referencedColumnName = "id", nullable = false)
	private User gifted;

	@Column
	@Temporal(TemporalType.TIMESTAMP)
	private Date createdDate = new Date();

	@Version
	private Long version;

	public Gift(User gifter, User gifted) {
		this.gifter = gifter;
		this.gifted = gifted;
	}
}
