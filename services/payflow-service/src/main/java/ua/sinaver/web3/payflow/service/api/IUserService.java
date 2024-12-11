package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.ProfileMessage;
import ua.sinaver.web3.payflow.message.WalletProfileRequestMessage;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;

import java.util.List;
import java.util.Map;

public interface IUserService {
	void saveUser(String identity);

	void saveUser(User user);

	User getOrCreateUserFromFarcasterProfile(FarcasterUser farcasterUser,
	                                         boolean forceWhitelist);

	void updateLastSeen(User user);

	void updateProfile(String identity, ProfileMessage profile, String invitationCode);

	User findByIdentity(String identity);

	User findByUsername(String username);

	User findByUsernameOrIdentity(String usernameOrIdentity);

	List<User> searchByUsernameQuery(String query);

	// TODO: add pagination
	List<User> findAll();

	Map<WalletProfileRequestMessage, User> searchByOwnedWallets(List<WalletProfileRequestMessage> wallets);

	User findByAccessToken(String accessToken);

	void clearAccessToken(User user);

	String getOrGenerateAccessToken(User user);
}
