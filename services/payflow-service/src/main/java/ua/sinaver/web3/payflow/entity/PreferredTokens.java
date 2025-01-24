package ua.sinaver.web3.payflow.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@ToString
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table
public class PreferredTokens {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
	@ToString.Exclude
	private User user;

	@Column(name = "tokens")
	private String tokens;

	@Transient
	private List<String> tokenList;

	@Version
	private Long version;

	@PostLoad
	private void initTokenList() {
		this.tokenList = tokens != null && !tokens.isEmpty()
				? Arrays.asList(tokens.split(","))
				: new ArrayList<>();
	}
}
