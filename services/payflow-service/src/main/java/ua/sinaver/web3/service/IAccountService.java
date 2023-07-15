package ua.sinaver.web3.service;

import java.util.List;

import ua.sinaver.web3.dto.AccountDto;

public interface IAccountService {
    void saveAccount(AccountDto accountDto);

    List<AccountDto> getAllAccounts(String userId);
}
