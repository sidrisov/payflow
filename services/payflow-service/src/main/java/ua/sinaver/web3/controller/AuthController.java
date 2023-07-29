package ua.sinaver.web3.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@CrossOrigin // default - allow all origins
public class AuthController {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthController.class);

    public static boolean authenticated = false;

    @GetMapping("/nonce")
    public String nonce() {
        return "oNCEHm5jzQU2WvuBB";
    }

    @PostMapping("/verify")
    public ResponseEntity verify(@RequestBody String message) {
        LOGGER.info("message {}", message);

        if (message == null || message.length() == 0) {
            return ResponseEntity.badRequest().build();
        } else {
            authenticated = true;
            return ResponseEntity.ok().build();
        }
    }

    @GetMapping("/logout")
    public void logout() {
        authenticated = false;
    }

}
