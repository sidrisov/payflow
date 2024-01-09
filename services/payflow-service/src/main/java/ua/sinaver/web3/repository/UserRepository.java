package ua.sinaver.web3.repository;

import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.WalletProfileRequestMessage;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends CrudRepository<User, Integer> {
        User findByIdentity(String identity);

        User findByUsernameOrIdentity(String username, String identity);

        default User findByUsernameOrIdentity(String usernameOrIdentity) {
                return findByUsernameOrIdentity(usernameOrIdentity, usernameOrIdentity);
        }

        List<User> findByDisplayNameContainingOrUsernameContainingOrIdentityContaining(String displayName,
                        String username,
                        String identity);

        @Query(value = "SELECT * FROM user WHERE id " +
                        "in (SELECT user_id FROM flow WHERE id " +
                        "in (SELECT flow_id FROM wallet WHERE " +
                        "address = :#{#wallet.address} AND network = :#{#wallet.network}))", nativeQuery = true)
        User findByOwnedWallet(@Param("wallet") WalletProfileRequestMessage wallet);

        List<User> findByAllowedTrueOrderByLastSeenDesc();
}
