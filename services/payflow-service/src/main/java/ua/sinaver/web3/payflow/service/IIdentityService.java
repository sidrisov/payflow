package ua.sinaver.web3.payflow.service;

import ua.sinaver.web3.payflow.message.IdentityMessage;

import java.util.List;

public interface IIdentityService {
	List<IdentityMessage> getIdentitiesInfo(List<String> identities);
}
