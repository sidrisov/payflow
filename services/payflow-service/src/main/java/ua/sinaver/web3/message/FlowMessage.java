package ua.sinaver.web3.message;

import java.util.List;

public record FlowMessage(String account, String title, String description, String uuid, List<WalletMessage> wallets) {
}
