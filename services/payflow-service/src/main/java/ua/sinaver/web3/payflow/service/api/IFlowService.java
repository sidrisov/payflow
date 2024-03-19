package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.data.Jar;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.FlowMessage;
import ua.sinaver.web3.payflow.message.JarMessage;
import ua.sinaver.web3.payflow.message.WalletMessage;

import java.util.List;

public interface IFlowService {

	Jar createJar(String title, String description, String image, String source, User user);

	void saveFlow(FlowMessage flowDto, User user);

	List<FlowMessage> getAllFlows(User user);

	FlowMessage findByUUID(String uuid);

	JarMessage findJarByUUID(String uuid);


	void addFlowWallet(String uuid, WalletMessage wallet, User user) throws Exception;

	void updateFlowWallet(String uuid, WalletMessage wallet, User user) throws Exception;

	void deleteFlowWallet(String uuid, WalletMessage wallet, User user) throws Exception;
}
