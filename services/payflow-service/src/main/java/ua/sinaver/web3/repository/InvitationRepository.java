package ua.sinaver.web3.repository;

import ua.sinaver.web3.data.Invitation;
import ua.sinaver.web3.data.User;

import org.springframework.data.repository.CrudRepository;

import lombok.val;

import java.util.Date;
import java.util.List;

public interface InvitationRepository extends CrudRepository<Invitation, Integer> {
        List<Invitation> findByInvitedBy(User invitedBy);

        Invitation findFirstByIdentityAndExpiryDateAfterOrCodeAndExpiryDateAfterOrderByCreatedDateAsc(String identity,
                        Date before1,
                        String code, Date before2);

        default Invitation findFirstValidByIdentityOrCode(String identity,
                        String code) {
                val now = new Date();
                return findFirstByIdentityAndExpiryDateAfterOrCodeAndExpiryDateAfterOrderByCreatedDateAsc(identity, now,
                                code, now);
        }

}
