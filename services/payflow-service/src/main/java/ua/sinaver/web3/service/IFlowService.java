package ua.sinaver.web3.service;

import java.util.List;

import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.FlowMessage;
import ua.sinaver.web3.message.WalletMessage;

public interface IFlowService {
    void saveFlow(FlowMessage flowDto, User user);

    List<FlowMessage> getAllFlows(User user);

    FlowMessage findByUUID(String uuid);

    void addFlowWallet(String uuid, WalletMessage wallet, User user) throws Exception;
    
    void updateFlowWallet(String uuid, WalletMessage wallet, User user) throws Exception;

    void deleteFlowWallet(String uuid, WalletMessage wallet, User user) throws Exception;
}
