package ua.sinaver.web3.payflow.repository;

import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.payflow.data.Invitation;
import ua.sinaver.web3.payflow.data.User;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public interface InvitationRepository extends CrudRepository<Invitation, Integer> {

	boolean existsByIdentityAndInviteeNull(String identity);

	Stream<Invitation> findByIdentityInAndInviteeNull(List<String> identities);

	boolean existsByCodeAndInviteeNull(String code);

	List<Invitation> findByInvitedBy(User invitedBy);

	Invitation findFirstByIdentityAndInviteeNullOrCodeAndCodeNotNullAndInviteeNullOrderByCreatedDateAsc(
			String identity,
			String code);

	default boolean existsByIdentityAndValid(String identity) {
		return existsByIdentityAndInviteeNull(identity);
	}

	default Map<String, Invitation> existsByIdentityInAndValid(List<String> identities) {
		return findByIdentityInAndInviteeNull(identities)
				.collect(Collectors.toMap(Invitation::getIdentity, Function.identity()));
	}

	default Invitation findFirstValidByIdentityOrCode(String identity,
	                                                  String code) {
		return findFirstByIdentityAndInviteeNullOrCodeAndCodeNotNullAndInviteeNullOrderByCreatedDateAsc(
				identity,
				code.toLowerCase());
	}
}
