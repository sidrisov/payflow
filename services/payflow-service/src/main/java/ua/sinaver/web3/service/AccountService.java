package ua.sinaver.web3.service;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import ua.sinaver.web3.data.Account;
import ua.sinaver.web3.dto.AccountDto;
import ua.sinaver.web3.repository.AccountRepository;

@Service
@Transactional
public class AccountService implements IAccountService {
    public static final Logger LOGGER = LoggerFactory.getLogger(AccountService.class);

    @Autowired
    private AccountRepository accountRepository;

    @Override
    public void saveAccount(AccountDto accountDto) {
        Account account = convert(accountDto);
        accountRepository.save(account);
        LOGGER.info("Saved account {}", account);
    }

    @Override
    public List<AccountDto> getAllAccounts(String userId) {
        List<Account> accounts = accountRepository.findByUserId(userId);
        return accounts.stream()
                .map(AccountService::convert)
                .toList();
    }

    private static AccountDto convert(Account account) {
        /*
         * List<WalletDto> wallets = account.getWallets().stream().map(w -> convert(w))
         * .toList();
         */
        return new AccountDto(account.getUserId(), account.getAddress(), account.getNetwork());
    }

    private static Account convert(AccountDto accountDto) {
        Account account = new Account(accountDto.userId(), accountDto.address(), accountDto.network());
        /*
         * List<Wallet> wallets = accountDto.wallets().stream().map(w -> {
         * Wallet wallet = convert(w);
         * wallet.setMaster(account);
         * return wallet;
         * }).toList();
         * account.setWallets(wallets);
         */
        return account;
    }
}
