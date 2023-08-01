package ua.sinaver.web3.service;

import ua.sinaver.web3.data.User;

public interface IUserService {
    void saveUser(String username, String signer);

    User findUser(String signer);
}
