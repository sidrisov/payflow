package ua.sinaver.web3.repository;

import ua.sinaver.web3.data.User;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

public interface UserRepository extends CrudRepository<User, Integer> {
    User findBySigner(String signer);

    User findByUsernameOrSigner(String username, String signer);

    List<User> findByUsernameContainingOrSignerContaining(String username, String signer);
}
