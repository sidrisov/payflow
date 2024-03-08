package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.ContactMessage;

import java.util.List;

public interface IFrameService {
	ContactMessage giftSpin(User initiator) throws Exception;

	User getFidProfile(int fid, String identity);

	User getFidProfile(String fname, String identity);

	List<User> getFidProfiles(int fid);

	List<User> getFidProfiles(String fname);

	List<String> getFidAddresses(int fid);

	List<String> getFnameAddresses(String fname);

	List<User> getFidProfiles(List<String> addresses);

	String getFidFname(int fid);
}
