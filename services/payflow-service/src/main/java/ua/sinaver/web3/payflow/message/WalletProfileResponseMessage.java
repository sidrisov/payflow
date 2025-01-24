package ua.sinaver.web3.payflow.message;

import ua.sinaver.web3.payflow.dto.ProfileMetaMessage;

public record WalletProfileResponseMessage(String address, int network,
                                           ProfileMetaMessage profile) {
}
