package ua.sinaver.web3.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
@CrossOrigin // default - allow all origins
public class UserController {

    @GetMapping("/info")
    public ResponseEntity user() {
        if (AuthController.authenticated) {
            return ResponseEntity.ok().body("{\"address\": \"address\"}");
        } else {
            return ResponseEntity.status(401).build();
        }
    }
}
