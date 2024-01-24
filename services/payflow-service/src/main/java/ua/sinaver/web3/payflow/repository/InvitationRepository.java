package ua.sinaver.web3.payflow.repository;

import lombok.val;
import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.payflow.data.Invitation;
import ua.sinaver.web3.payflow.data.User;

import java.util.Date;
import java.util.List;

public interface InvitationRepository extends CrudRepository<Invitation, Integer> {

	boolean existsByIdentityAndExpiryDateAfterAndInviteeNull(String identity, Date before);

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

	default Invitation findFirstValidByIdentityOrCode(String identity,
	                                                  String code) {
		val now = new Date();
		return findFirstByIdentityAndExpiryDateAfterAndInviteeNullOrCodeAndCodeNotNullAndExpiryDateAfterAndInviteeNullOrderByCreatedDateAsc(
				identity, now,
				code, now);
	}

}
