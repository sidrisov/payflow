package ua.sinaver.web3.service;

import ua.sinaver.web3.data.User;

public interface IUserService {
    void saveUser(String signer, String username);

    void updateUsername(String signer, String username);

    User findBySigner(String signer);

    User findByUsername(String username);
}
