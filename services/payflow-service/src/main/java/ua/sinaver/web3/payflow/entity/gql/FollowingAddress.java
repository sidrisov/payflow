package ua.sinaver.web3.payflow.entity.gql;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class FollowingAddress {
	private List<String> addresses;
}
