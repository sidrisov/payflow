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
@Table
public class Jar {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@OneToOne(cascade = CascadeType.PERSIST)
	@JoinColumn(name = "flow_id", nullable = false)
	private Flow flow;

	@Column
	private String description;

	@Column
	private String image;

	@Column
	private String link;

	@Column
	@Temporal(TemporalType.TIMESTAMP)
	private Date createdDate = new Date();

	@Version
	private Long version;

	public Jar(Flow flow, String description, String image, String link) {
		this.flow = flow;
		this.description = description;
		this.image = image;
		this.link = link;
	}
}
