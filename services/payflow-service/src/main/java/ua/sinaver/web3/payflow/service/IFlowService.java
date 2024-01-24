package ua.sinaver.web3.payflow.service;

import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.FlowMessage;
import ua.sinaver.web3.payflow.message.WalletMessage;

import java.util.List;

public interface IFlowService {
	void saveFlow(FlowMessage flowDto, User user);

	List<FlowMessage> getAllFlows(User user);

	FlowMessage findByUUID(String uuid);

	void addFlowWallet(String uuid, WalletMessage wallet, User user) throws Exception;

	void updateFlowWallet(String uuid, WalletMessage wallet, User user) throws Exception;

	void deleteFlowWallet(String uuid, WalletMessage wallet, User user) throws Exception;
}
