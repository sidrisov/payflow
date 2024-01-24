package ua.sinaver.web3.payflow.service;

import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.AccountMessage;

import java.util.List;

public interface IAccountService {
	void saveAccount(AccountMessage accountDto, User user);

	List<AccountMessage> getAllAccounts(User user);
}
