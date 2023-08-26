package ua.sinaver.web3.service;

import java.util.List;

import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.AccountMessage;

public interface IAccountService {
    void saveAccount(AccountMessage accountDto, User user);

    List<AccountMessage> getAllAccounts(User user);
}
