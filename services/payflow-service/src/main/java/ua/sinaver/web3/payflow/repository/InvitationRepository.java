package ua.sinaver.web3.payflow.repository;

import lombok.val;
import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.payflow.data.Invitation;
import ua.sinaver.web3.payflow.data.User;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public interface InvitationRepository extends CrudRepository<Invitation, Integer> {

	boolean existsByIdentityAndExpiryDateAfterAndInviteeNull(String identity, Date before);

	Stream<Invitation> findByIdentityInAndExpiryDateAfterAndInviteeNull(List<String> identities,
	                                                                    Date before);

	boolean existsByCodeAndInviteeNull(String code);

	List<Invitation> findByInvitedBy(User invitedBy);

	// TODO: fix a bug when searching by NULL
	Invitation findFirstByIdentityAndExpiryDateAfterAndInviteeNullOrCodeAndCodeNotNullAndExpiryDateAfterAndInviteeNullOrderByCreatedDateAsc(
			String identity,
			Date before1,
			String code, Date before2);

	default boolean existsByIdentityAndValid(String identity) {
		val now = new Date();
		return existsByIdentityAndExpiryDateAfterAndInviteeNull(identity, now);
	}

	default Map<String, Invitation> existsByIdentityInAndValid(List<String> identities) {

		val now = new Date();
		return findByIdentityInAndExpiryDateAfterAndInviteeNull(identities, now)
				.collect(Collectors.toMap(Invitation::getIdentity, Function.identity()));
	}

	default Invitation findFirstValidByIdentityOrCode(String identity,
	                                                  String code) {
		val now = new Date();
		return findFirstByIdentityAndExpiryDateAfterAndInviteeNullOrCodeAndCodeNotNullAndExpiryDateAfterAndInviteeNullOrderByCreatedDateAsc(
				identity, now,
				code, now);
	}

}
