package ua.sinaver.web3.repository;

import ua.sinaver.web3.data.User;

import org.springframework.data.repository.CrudRepository;

public interface UserRepository extends CrudRepository<User, Integer> {
    User findBySigner(String signer);
}
