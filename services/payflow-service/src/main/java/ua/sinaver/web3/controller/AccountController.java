package ua.sinaver.web3.controller;

import java.security.Principal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.transaction.Transactional;
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.AccountMessage;
import ua.sinaver.web3.service.IAccountService;
import ua.sinaver.web3.service.IUserService;

@RestController
@RequestMapping("/accounts")
@CrossOrigin(origins = "${dapp.url}", allowCredentials = "true")
@Transactional
class AccountController {
    private static final Logger LOGGER = LoggerFactory.getLogger(AccountController.class);

    @Autowired
    private IAccountService accountService;

    @Autowired
    private IUserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void createAccount(@RequestBody AccountMessage accountDto, Principal principal) throws Exception {
        User user = userService.findUser(principal.getName());
        if (user == null) {
            throw new Exception("User doesn't exist: " + principal.getName());
        }
        accountService.saveAccount(accountDto, user);
    }

    @GetMapping
    public List<AccountMessage> getAllFlowsForAccount(Principal principal) throws Exception {
        User user = userService.findUser(principal.getName());
        if (user == null) {
            throw new Exception("User doesn't exist: " + principal.getName());
        }

        return accountService.getAllAccounts(user);
    }
}
