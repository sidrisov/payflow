package ua.sinaver.web3.payflow.service.api;

import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.ContactMessage;

public interface IFrameService {
	ContactMessage giftSpin(User initiator) throws Exception;
}
