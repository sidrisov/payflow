package ua.sinaver.web3.controller;

import java.security.Principal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/me")
@CrossOrigin(origins = "${dapp.url}", allowCredentials = "true")
public class UserController {

    private static final Logger LOGGER = LoggerFactory.getLogger(UserController.class);

    @GetMapping
    public Profile user(Principal principal) {
        LOGGER.debug("Principal: {}", principal);
        return new Profile(principal.getName());
    }

    record Profile(String address) {
    }

}
