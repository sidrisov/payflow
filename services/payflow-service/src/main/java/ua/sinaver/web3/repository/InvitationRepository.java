package ua.sinaver.web3.repository;

import ua.sinaver.web3.data.Invitation;
import ua.sinaver.web3.data.User;

import org.springframework.data.repository.CrudRepository;

import lombok.val;

import java.util.Date;
import java.util.List;

public interface InvitationRepository extends CrudRepository<Invitation, Integer> {

        boolean existsByIdentityAndInviteeNull(String identity);

        boolean existsByCodeAndInviteeNull(String code);

        List<Invitation> findByInvitedBy(User invitedBy);

        // TODO: fix a bug when searching by NULL
        Invitation findFirstByIdentityAndExpiryDateAfterAndInviteeNullOrCodeAndCodeNotNullAndExpiryDateAfterAndInviteeNullOrderByCreatedDateAsc(
                        String identity,
                        Date before1,
                        String code, Date before2);

        default Invitation findFirstValidByIdentityOrCode(String identity,
                        String code) {
                val now = new Date();
                return findFirstByIdentityAndExpiryDateAfterAndInviteeNullOrCodeAndCodeNotNullAndExpiryDateAfterAndInviteeNullOrderByCreatedDateAsc(
                                identity, now,
                                code, now);
        }

}
