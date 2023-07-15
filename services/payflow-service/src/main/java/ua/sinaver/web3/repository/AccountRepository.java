package ua.sinaver.web3.repository;

import ua.sinaver.web3.data.Account;
import ua.sinaver.web3.data.Flow;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

public interface AccountRepository extends CrudRepository<Account, Integer> {
    List<Account> findByUserId(String userId);

    Flow findByAddressAndNetwork(String address, String network);
}
