package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.IdentityMessage;

import java.util.List;

public interface IIdentityService {
	User getFidProfile(int fid, String identity);

	User getFidProfile(String fname, String identity);

	List<User> getProfiles(int fid);

	List<User> getProfiles(String fname);

	List<String> getFidAddresses(int fid);

	List<String> getIdentityAddresses(String identity);

	String getENSAddress(String ens);

	List<String> getFnameAddresses(String fname);

	List<User> getProfiles(List<String> addresses);

	String getFidFname(int fid);

	String getIdentityFname(String identity);

	String getFnameFid(String fname);

	String getIdentityFid(String identity);

	List<IdentityMessage> getIdentitiesInfo(List<String> identities);

	String getHighestScoredIdentity(List<String> identities);

	IdentityMessage getHighestScoredIdentityInfo(List<String> identities);

	List<IdentityMessage> getIdentitiesInfo(List<String> identities, String me);
}
