package ua.sinaver.web3.service;

import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.AccountMessage;

import java.util.List;

public interface IAccountService {
	void saveAccount(AccountMessage accountDto, User user);

	List<AccountMessage> getAllAccounts(User user);
}
