package ua.sinaver.web3.service;

import java.util.List;

import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.ProfileMessage;

public interface IUserService {
    void saveUser(String signer, String username);

    void updateProfile(String signer, ProfileMessage profile);

    User findBySigner(String signer);

    User findByUsername(String username);

    List<User> searchByUsernameQuery(String query);
}
