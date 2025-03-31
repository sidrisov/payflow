package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.entity.User;
import ua.sinaver.web3.payflow.message.IdentityMessage;

import java.util.List;

public interface IIdentityService {
	User getProfileByFid(int fid, String identity);

	User getProfileByFname(String fname, String identity);

	List<User> getProfilesByFid(int fid);

	List<User> getProfilesByFname(String fname);

	List<String> getFarcasterAddressesByFid(int fid);

	List<String> getFarcasterAddressesByAddress(String address);

	String getENSAddress(String ens);

	List<String> getFarcasterAddressesByUsername(String fname);

	List<User> getProfilesByAddresses(List<String> addresses);

	String getFidFname(int fid);

	String getFarcasterUsernameByAddress(String identity);

	Integer getFnameFid(String fname);

	Integer getIdentityFid(String identity);

	IdentityMessage getIdentityInfo(String identity);

	List<IdentityMessage> getIdentitiesInfo(List<String> identities);

	List<IdentityMessage> getIdentitiesInfo(int fid);

	String getHighestScoredIdentity(List<String> identities);

	IdentityMessage getHighestScoredIdentityInfo(List<String> identities);
}
