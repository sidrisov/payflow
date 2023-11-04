package ua.sinaver.web3.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.val;
import lombok.extern.slf4j.Slf4j;
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.FlowMessage;
import ua.sinaver.web3.service.FlowService;
import ua.sinaver.web3.service.UserService;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "${dapp.url}", allowCredentials = "true")
@Slf4j
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private FlowService flowService;

    @GetMapping("/me")
    public Profile user(Principal principal) {
        log.trace("{}", principal);
        User user = userService.findBySigner(principal.getName());
        if (user != null) {
            val flows = flowService.getAllFlows(user);
            return new Profile(user.getUsername(), user.getSigner(), flows.size() != 0 ? flows.get(0) : null);
        } else {
            return null;
        }
    }

    @PostMapping(value = "/me")
    public void updateUserName(Principal principal, @RequestBody String username) {
        log.debug("Update username: {} by {}", username, principal.getName());

        userService.updateUsername(principal.getName(), username);

    }

    @GetMapping
    public List<Profile> searchProfile(@RequestParam(value = "search") String username) {
        List<User> users = userService.searchByUsernameQuery(username);
        log.debug("User: {} for {}", users, username);
        if (users != null) {
            return users.stream().map(user -> new Profile(user.getUsername(), user.getSigner(), null)).toList();
        } else {
            return null;
        }
    }

    @GetMapping("/{username}")
    public Profile findProfile(@PathVariable String username) {
        val user = userService.findByUsername(username);

        log.debug("User: {} for {}", user, username);
        if (user != null) {
            val flows = flowService.getAllFlows(user);
            return new Profile(user.getUsername(), user.getSigner(), flows.size() != 0 ? flows.get(0) : null);
        } else {
            return null;
        }
    }

    record Profile(String username, String address, FlowMessage defaultFlow) {
    }

}
