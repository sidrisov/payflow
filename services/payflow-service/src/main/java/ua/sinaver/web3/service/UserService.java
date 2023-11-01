package ua.sinaver.web3.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.repository.UserRepository;

@Service
@Transactional
public class UserService implements IUserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public void saveUser(String signer, String username) {
        userRepository.save(new User(signer, username));
    }

    @Override
    public void updateUsername(String signer, String username) {
        User user = userRepository.findBySigner(signer);
        if (user != null && (user.getUsername() == null || !user.getUsername().equals(username))) {
            user.setUsername(username);
            user.setOnboarded(true);
        }
    }

    @Override
    public User findBySigner(String signer) {
        return userRepository.findBySigner(signer);
    }

    @Override
    public User findByUsername(String username) {
        return userRepository.findByUsernameOrSigner(username, username);
    }

    @Override
    public List<User> searchByUsernameQuery(String query) {
        return userRepository.findByUsernameContainingOrSignerContaining(query, query);
    }
}
