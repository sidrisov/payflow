package ua.sinaver.web3.controller;

import java.security.Principal;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/me")
@CrossOrigin(origins = "${dapp.url}", allowCredentials = "true")
@Slf4j
public class UserController {
    @GetMapping
    public Profile user(Principal principal) {
        log.trace("{}", principal);
        return new Profile(principal.getName());
    }

    record Profile(String address) {
    }

}
