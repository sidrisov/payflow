package ua.sinaver.web3.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.transaction.Transactional;
import ua.sinaver.web3.dto.AccountDto;
import ua.sinaver.web3.service.IAccountService;

@RestController
@RequestMapping("/accounts")
@CrossOrigin // default - allow all origins
@Transactional
class AccountController {
    public static final Logger LOGGER = LoggerFactory.getLogger(AccountController.class);

    @Autowired
    private IAccountService accountService;

    @PostMapping
    public void createFlow(@RequestBody AccountDto accountDto) {
        accountService.saveAccount(accountDto);
    }

    @GetMapping
    public List<AccountDto> getAllFlowsForAccount(@RequestParam String userId) {
        return accountService.getAllAccounts(userId);
    }
}
