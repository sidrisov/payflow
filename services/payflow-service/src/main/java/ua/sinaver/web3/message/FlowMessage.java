package ua.sinaver.web3.message;

import java.util.List;

import lombok.val;
import ua.sinaver.web3.data.Flow;
import ua.sinaver.web3.data.User;

public record FlowMessage(String owner, String title, String description, String uuid, String walletProvider,
        String saltNonce, List<WalletMessage> wallets) {
    public static FlowMessage convert(Flow flow, User user) {
        val wallets = flow.getWallets().stream().map(w -> WalletMessage.convert(w))
                .toList();
        return new FlowMessage(user.getSigner(), flow.getTitle(), flow.getDescription(), flow.getUuid(),
                flow.getWalletProvider(), flow.getSaltNonce(), wallets);
    }

    public static Flow convert(FlowMessage flowMessage, User user) {
        val flow = new Flow(user.getId(), flowMessage.title(), flowMessage.description(), flowMessage.walletProvider(),
                flowMessage.saltNonce());
        val wallets = flowMessage.wallets().stream().map(w -> {
            val wallet = WalletMessage.convert(w);
            wallet.setFlow(flow);
            return wallet;
        }).toList();
        flow.setWallets(wallets);
        return flow;
    }
}
