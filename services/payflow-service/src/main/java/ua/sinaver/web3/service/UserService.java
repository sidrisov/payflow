package ua.sinaver.web3.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.repository.UserRepository;

@Service
@Transactional
public class UserService implements IUserService {
    public static final Logger LOGGER = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    public void saveUser(String username, String signer) {
        userRepository.save(new User(username, signer));
    }

    @Override
    public User findUser(String signer) {
        return userRepository.findBySigner(signer);
    }

}
